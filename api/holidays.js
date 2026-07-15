const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;

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

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || text || "Supabase request failed.");
  return data;
}

function toDb(item) {
  const now = Date.now();
  const date = String(item.date || item.calendarDate || "");
  return {
    id: date,
    calendar_date: date,
    status: item.status,
    label: item.label || "",
    created_at: Number(item.createdAt || now),
    updated_at: now
  };
}

function fromDb(row) {
  return {
    id: row.id || row.calendar_date,
    date: row.calendar_date,
    status: row.status,
    label: row.label || "",
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

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");

    if (req.method === "GET") {
      if (requestUrl.searchParams.get("check") === "1") {
        if (!requireAdmin(req)) return json(res, 401, { error: "Unauthorized" });
        return json(res, 200, { ok: true });
      }
      const rows = await supabase("team_calendar_days?select=*&order=calendar_date.asc");
      return json(res, 200, rows.map(fromDb));
    }

    if (req.method === "POST") {
      if (!requireAdmin(req)) return json(res, 401, { error: "Unauthorized" });
      const body = await readBody(req);
      const date = String(body.date || "");
      const status = String(body.status || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { error: "date is required" });
      if (!["holiday", "workday"].includes(status)) return json(res, 400, { error: "invalid status" });

      const rows = await supabase("team_calendar_days?on_conflict=calendar_date", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(toDb({
          date,
          status,
          label: String(body.label || "")
        }))
      });
      return json(res, 200, fromDb(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return json(res, 401, { error: "Unauthorized" });
      const date = requestUrl.searchParams.get("date") || "";
      if (!date) return json(res, 400, { error: "date is required" });
      await supabase(`team_calendar_days?calendar_date=eq.${encodeURIComponent(date)}`, {
        method: "DELETE"
      });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
