const { supabase, readAll, json, readBody, errorResponse } = require('../lib/storage');
const PACK_PREFIX = "\n\n__EXHIBITION_DAYS_JSON__";
function isMissingDayTableError(error) {
  const message = String(error?.message || error || "");
  return /exhibition_event_days|event_day_id|schema cache|relation|column/i.test(message)
    && /not exist|could not find|schema cache|does not exist/i.test(message);
}


function unpackMemo(rawMemo) {
  const raw = String(rawMemo || "");
  const index = raw.indexOf(PACK_PREFIX);
  if (index < 0) return { memo: raw, days: [] };
  const memo = raw.slice(0, index).trim();
  const packed = raw.slice(index + PACK_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(packed);
    const days = Array.isArray(parsed.days)
      ? parsed.days.map(day => ({
        id: String(day.id || ""),
        date: String(day.date || ""),
        neededCount: Math.max(1, Math.min(7, Number(day.neededCount || 2))),
        attendees: cleanAttendees(day.attendees)
      })).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date))
      : [];
    return { memo, days };
  } catch (error) {
    return { memo: raw, days: [] };
  }
}

function fromEventDb(row, days) {
  const unpacked = unpackMemo(row.memo);
  let normalizedDays = (days || []).sort((a, b) => a.date.localeCompare(b.date));
  if (unpacked.days.length && (!normalizedDays.length || normalizedDays.every(day => !(day.attendees || []).length))) {
    normalizedDays = unpacked.days.sort((a, b) => a.date.localeCompare(b.date));
  }
  const attendeeSet = new Set();
  normalizedDays.forEach(day => {
    (day.attendees || []).forEach(owner => attendeeSet.add(owner));
  });
  return {
    id: row.id,
    date: row.event_date,
    title: row.title,
    neededCount: Number(row.needed_count || 2),
    memo: unpacked.memo || "",
    attendees: Array.from(attendeeSet),
    days: normalizedDays,
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0)
  };
}


function cleanAttendees(value) {
  const allowed = new Set(["성진욱", "김무영", "이승엽", "김태홍", "제성규", "송진영", "이현욱"]);
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map(name => String(name || "").trim())
    .filter(name => {
      if (!allowed.has(name) || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
}

function cleanDays(body) {
  const rawDays = Array.isArray(body.days) && body.days.length
    ? body.days
    : [{ date: body.date, neededCount: body.neededCount, attendees: body.attendees }];
  const seenDates = new Set();
  return rawDays
    .map(day => ({
      date: String(day.date || ""),
      neededCount: Math.max(1, Math.min(7, Number(day.neededCount || body.neededCount || 2))),
      attendees: cleanAttendees(day.attendees)
    }))
    .filter(day => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || seenDates.has(day.date)) return false;
      seenDates.add(day.date);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function loadEvents() {
  const events = await readAll("exhibition_events");
  let dayRows = [];
  try {
    dayRows = await readAll("exhibition_event_days");
  } catch (error) {
    if (!isMissingDayTableError(error)) throw error;
  }
  const attendeeRows = await readAll("exhibition_attendees");

  const daysByEvent = {};
  dayRows.forEach(row => {
    if (!daysByEvent[row.event_id]) daysByEvent[row.event_id] = [];
    daysByEvent[row.event_id].push({
      id: row.id,
      date: row.event_date,
      neededCount: Number(row.needed_count || 2),
      attendees: []
    });
  });

  const dayById = {};
  Object.keys(daysByEvent).forEach(eventId => {
    daysByEvent[eventId].forEach(day => {
      dayById[day.id] = day;
    });
  });

  const legacyAttendeeMap = {};
  attendeeRows.forEach(row => {
    if (row.event_day_id && dayById[row.event_day_id]) {
      dayById[row.event_day_id].attendees.push(row.owner);
      return;
    }
    if (!legacyAttendeeMap[row.event_id]) legacyAttendeeMap[row.event_id] = [];
    legacyAttendeeMap[row.event_id].push(row.owner);
  });

  return events.map(row => {
    let days = daysByEvent[row.id] || [];
    if (!days.length) {
      days = [{
        id: `${row.id}-${String(row.event_date || "").replace(/-/g, "")}`,
        date: row.event_date,
        neededCount: Number(row.needed_count || 2),
        attendees: legacyAttendeeMap[row.id] || []
      }];
    }
    return fromEventDb(row, days);
  });
}


module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET') {
      if (url.searchParams.get('check') === '1') return json(res,200,{ok:true});
      return json(res,200,await loadEvents());
    }
    if (!['POST','DELETE'].includes(req.method)) return json(res,405,{error:'Method not allowed'});
    const body = req.method === 'DELETE' ? Object.fromEntries(url.searchParams) : await readBody(req);
    if (!body.operationId) throw new Error('client_update_required');
    if (!body.id) throw new Error('invalid_request');
    const deleting = req.method === 'DELETE';
    const days = deleting ? [] : cleanDays(body);
    if (!deleting && (!days.length || !String(body.title || '').trim() || !days.some(day => day.attendees.length))) throw new Error('invalid_request');
    const result = await supabase('rpc/mutate_exhibition_safe',{
      method:'POST',body:JSON.stringify({
        p_event: deleting ? {id:body.id} : {id:body.id,title:String(body.title).trim(),days},
        p_delete:deleting,p_expected_updated_at:body.expectedUpdatedAt == null ? null : Number(body.expectedUpdatedAt),
        p_operation_id:body.operationId
      })
    });
    return json(res,200,deleting ? result : fromEventDb(result.row,result.days));
  } catch(error) { return errorResponse(res,error); }
};
