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
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || text || "Supabase request failed.");
  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (!requireAdmin(req)) return json(res, 401, { error: "Unauthorized" });
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const rows = await supabase("report_logs?select=*&order=created_at.desc&limit=200");
    return json(res, 200, rows);
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
