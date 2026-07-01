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

  if (!response.ok) {
    throw new Error(data?.message || text || "Supabase request failed.");
  }

  return data;
}

function toDb(item) {
  return {
    id: item.id,
    created_at: Number(item.createdAt || Date.now()),
    updated_at: Number(item.updatedAt || Date.now()),
    report_date: item.date,
    owner: item.owner,
    client: item.client,
    type: item.type,
    product: item.product,
    amount: Number(item.amount || 0),
    collection_year: item.collectionYear ? Number(item.collectionYear) : null,
    collection_month: item.collectionMonth ? Number(item.collectionMonth) : null,
    prescription_done: Boolean(item.prescriptionDone)
  };
}

function fromDb(row) {
  return {
    id: row.id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    date: row.report_date,
    owner: row.owner,
    client: row.client,
    type: row.type,
    product: row.product,
    amount: Number(row.amount || 0),
    collectionYear: row.collection_year ? Number(row.collection_year) : null,
    collectionMonth: row.collection_month ? Number(row.collection_month) : null,
    prescriptionDone: Boolean(row.prescription_done)
  };
}
function logRow(action, actor, beforeRow, afterRow) {
  const beforeData = beforeRow ? fromDb(beforeRow) : null;
  const afterData = afterRow ? fromDb(afterRow) : null;
  return {
    action,
    created_at: Date.now(),
    actor: actor || afterData?.owner || beforeData?.owner || "",
    report_id: afterData?.id || beforeData?.id || "",
    client: afterData?.client || beforeData?.client || "",
    before_data: beforeData,
    after_data: afterData
  };
}
async function writeLog(action, actor, beforeRow, afterRow) {
  await supabase("report_logs", {
    method: "POST",
    body: JSON.stringify(logRow(action, actor, beforeRow, afterRow))
  });
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

    if (req.method === "GET" && requestUrl.searchParams.get("debug") === "1") {
      const baseUrl = cleanSupabaseUrl();
      return json(res, 200, {
        ok: true,
        hasSupabaseUrl: Boolean(baseUrl),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        supabaseUrlLooksRight: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(baseUrl),
        supabaseUrlStart: baseUrl ? baseUrl.slice(0, 28) : "",
        message: "Both values must be true. Do not share the service role key."
      });
    }

    if (req.method === "GET") {
      const rows = await supabase("reports?select=*&order=created_at.desc");
      return json(res, 200, rows.map(fromDb));
    }

    if (req.method === "POST") {
      const item = await readBody(req);
      const now = Date.now();
      item.id = item.id || `${now}-${Math.random().toString(16).slice(2)}`;
      item.createdAt = item.createdAt || now;
      item.updatedAt = now;
      const rows = await supabase("reports", {
        method: "POST",
        body: JSON.stringify(toDb(item))
      });
      return json(res, 201, fromDb(rows[0]));
    }

    if (req.method === "PUT") {
      const item = await readBody(req);
      const actor = item.actor || item.owner || "";
      const oldRows = await supabase(`reports?id=eq.${encodeURIComponent(item.id)}&select=*`);
      item.updatedAt = Date.now();
      const rows = await supabase(`reports?id=eq.${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        body: JSON.stringify(toDb(item))
      });
      await writeLog("update", actor, oldRows[0] || null, rows[0] || null);
      return json(res, 200, fromDb(rows[0]));
    }

    if (req.method === "DELETE") {
      const ids = requestUrl.searchParams.getAll("id");
      const actor = requestUrl.searchParams.get("actor") || "";
      if (!ids.length) return json(res, 400, { error: "id is required" });

      for (const id of ids) {
        const oldRows = await supabase(`reports?id=eq.${encodeURIComponent(id)}&select=*`);
        await supabase(`reports?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
        await writeLog("delete", actor, oldRows[0] || null, null);
      }
      return json(res, 200, { ok: true, count: ids.length });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
