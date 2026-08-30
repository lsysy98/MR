const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const PACK_PREFIX = "\n\n__EXHIBITION_DAYS_JSON__";

function cleanSupabaseUrl() {
  if (!SUPABASE_URL) return "";
  return SUPABASE_URL
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/g, "");
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function requireAdmin(req) {
  const requestUrl = new URL(req.url, "http://localhost");
  const key = requestUrl.searchParams.get("key") || "";
  return Boolean(ADMIN_KEY && key === ADMIN_KEY);
}

async function supabase(path, options = {}) {
  const baseUrl = cleanSupabaseUrl();
  if (!baseUrl || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(baseUrl)) {
    throw new Error("SUPABASE_URL must look like https://xxxx.supabase.co");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(`${baseUrl}/rest/v1/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Supabase response timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || text || "Supabase request failed.");
  return data;
}

function toEventDb(item) {
  const now = Date.now();
  return {
    id: item.id,
    event_date: item.date,
    title: item.title,
    needed_count: Number(item.neededCount || 2),
    memo: item.memo || "",
    created_at: Number(item.createdAt || now),
    updated_at: Number(item.updatedAt || now)
  };
}

function toDayDb(day, eventId, now) {
  return {
    id: day.id || `${eventId}-${day.date.replace(/-/g, "")}`,
    event_id: eventId,
    event_date: day.date,
    needed_count: Number(day.neededCount || 2),
    created_at: Number(day.createdAt || now),
    updated_at: Number(day.updatedAt || now)
  };
}

function isMissingDayTableError(error) {
  const message = String(error?.message || error || "");
  return /exhibition_event_days|event_day_id|schema cache|relation|column/i.test(message)
    && /not exist|could not find|schema cache|does not exist/i.test(message);
}

function packMemo(memo, days) {
  return `${String(memo || "").trim()}${PACK_PREFIX}${JSON.stringify({ days })}`;
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

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
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
  const events = await supabase("exhibition_events?select=*&order=event_date.desc,created_at.desc");
  let dayRows = [];
  try {
    dayRows = await supabase("exhibition_event_days?select=*&order=event_date.asc");
  } catch (error) {
    if (!isMissingDayTableError(error)) throw error;
  }
  const attendeeRows = await supabase("exhibition_attendees?select=*&order=created_at.asc");

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

async function savePackedEvent(event, days) {
  const packedEvent = {
    ...event,
    memo: packMemo(event.memo, days)
  };
  const rows = await supabase("exhibition_events?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(toEventDb(packedEvent))
  });
  try {
    await supabase(`exhibition_attendees?event_id=eq.${encodeURIComponent(event.id)}`, {
      method: "DELETE"
    });
  } catch (error) {
    if (!isMissingDayTableError(error)) throw error;
  }
  return fromEventDb(rows[0], days);
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");

    if (req.method === "GET") {
      if (requestUrl.searchParams.get("check") === "1") {
        return json(res, 200, { ok: true });
      }
      return json(res, 200, await loadEvents());
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const now = Date.now();
      const title = String(body.title || "").trim();
      const days = cleanDays(body);
      if (!days.length) return json(res, 400, { error: "days are required" });
      if (!title) return json(res, 400, { error: "title is required" });
      if (!days.some(day => day.attendees.length)) return json(res, 400, { error: "attendees are required" });

      const event = {
        id: body.id || `${now}-${Math.random().toString(16).slice(2)}`,
        date: days[0].date,
        title,
        neededCount: Math.max(1, Math.min(7, Number(body.neededCount || days[0].neededCount || 2))),
        memo: String(body.memo || "").trim(),
        createdAt: Number(body.createdAt || now),
        updatedAt: now
      };

      const rows = await supabase("exhibition_events?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(toEventDb(event))
      });

      try {
        await supabase(`exhibition_attendees?event_id=eq.${encodeURIComponent(event.id)}`, {
          method: "DELETE"
        });
        await supabase(`exhibition_event_days?event_id=eq.${encodeURIComponent(event.id)}`, {
          method: "DELETE"
        });

        const dayPayload = days.map(day => toDayDb(day, event.id, now));
        await supabase("exhibition_event_days", {
          method: "POST",
          body: JSON.stringify(dayPayload)
        });

        const attendeePayload = [];
        dayPayload.forEach(day => {
          const sourceDay = days.find(item => item.date === day.event_date) || { attendees: [] };
          sourceDay.attendees.forEach(owner => {
            attendeePayload.push({
              id: `${day.id}-${owner}`,
              event_id: event.id,
              event_day_id: day.id,
              owner,
              created_at: now
            });
          });
        });
        if (attendeePayload.length) {
          await supabase("exhibition_attendees", {
            method: "POST",
            body: JSON.stringify(attendeePayload)
          });
        }

        return json(res, 200, fromEventDb(rows[0], dayPayload.map(day => ({
          id: day.id,
          date: day.event_date,
          neededCount: day.needed_count,
          attendees: (days.find(item => item.date === day.event_date) || { attendees: [] }).attendees
        }))));
      } catch (error) {
        if (!isMissingDayTableError(error)) throw error;
        return json(res, 200, await savePackedEvent(event, days));
      }
    }

    if (req.method === "DELETE") {
      const id = requestUrl.searchParams.get("id") || "";
      if (!id) return json(res, 400, { error: "id is required" });
      await supabase(`exhibition_attendees?event_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      try {
        await supabase(`exhibition_event_days?event_id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE"
        });
      } catch (error) {
        if (!isMissingDayTableError(error)) throw error;
      }
      await supabase(`exhibition_events?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
