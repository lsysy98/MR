const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  if (!response.ok) {
    throw new Error(data?.message || text || "Supabase request failed.");
  }

  return data;
}

function toDb(item) {
  return {
    id: item.id,
    report_date: item.date,
    owner: item.owner,
    completed_at: Number(item.completedAt || Date.now()),
    status: item.status || "done"
  };
}

function fromDb(row) {
  return {
    id: row.id,
    date: row.report_date,
    owner: row.owner,
    completedAt: Number(row.completed_at),
    status: row.status || "done"
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
      const date = requestUrl.searchParams.get("date") || "";
      const owner = requestUrl.searchParams.get("owner") || "";
      const status = requestUrl.searchParams.get("status") || "";
      if (!date && !owner) return json(res, 400, { error: "date or owner is required" });
      const filters = [
        date ? `report_date=eq.${encodeURIComponent(date)}` : "",
        owner ? `owner=eq.${encodeURIComponent(owner)}` : "",
        status ? `status=eq.${encodeURIComponent(status)}` : ""
      ].filter(Boolean).join("&");
      const rows = await supabase(`daily_completions?${filters}&select=*&order=report_date.asc,completed_at.asc`);
      return json(res, 200, rows.map(fromDb));
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const date = String(body.date || "");
      const owner = String(body.owner || "");
      if (!date || !owner) return json(res, 400, { error: "date and owner are required" });
      const status = String(body.status || "done");
      if (!["done", "leave"].includes(status)) return json(res, 400, { error: "invalid status" });

      const item = {
        id: `${date}-${owner}`,
        date,
        owner,
        completedAt: Date.now(),
        status
      };
      const rows = await supabase("daily_completions?on_conflict=report_date,owner", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(toDb(item))
      });
      return json(res, 200, fromDb(rows[0]));
    }

    if (req.method === "DELETE") {
      const date = requestUrl.searchParams.get("date") || "";
      const owner = requestUrl.searchParams.get("owner") || "";
      const status = requestUrl.searchParams.get("status") || "";
      if (!date || !owner) return json(res, 400, { error: "date and owner are required" });
      const statusFilter = status ? `&status=eq.${encodeURIComponent(status)}` : "";
      await supabase(`daily_completions?report_date=eq.${encodeURIComponent(date)}&owner=eq.${encodeURIComponent(owner)}${statusFilter}`, {
        method: "DELETE"
      });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
