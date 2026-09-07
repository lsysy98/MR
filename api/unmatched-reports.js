const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;

const OWNER_ORDER = ["성진욱", "김무영", "이승엽", "김태홍", "제성규", "송진영", "이현욱"];

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
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function cleanCell(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function formatWon(value) {
  return Number(value || 0).toLocaleString("ko-KR") + "원";
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
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    throw new Error(data?.message || text || "Supabase request failed.");
  }

  return data;
}

async function supabasePaged(pathBase, pageSize = 1000, maxPages = 30) {
  const rows = [];
  for (let page = 0; page < maxPages; page += 1) {
    const separator = pathBase.includes("?") ? "&" : "?";
    const pageRows = await supabase(`${pathBase}${separator}limit=${pageSize}&offset=${page * pageSize}`);
    if (!Array.isArray(pageRows) || !pageRows.length) break;
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
  }
  return rows;
}

function ownerSort(a, b) {
  const ai = OWNER_ORDER.indexOf(a.owner);
  const bi = OWNER_ORDER.indexOf(b.owner);
  if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  return a.owner.localeCompare(b.owner, "ko");
}

function groupMissingReports(rows) {
  const ownerMap = new Map();

  rows.forEach((row) => {
    if (cleanCell(row.client_code)) return;
    const owner = cleanCell(row.owner) || "담당자 미지정";
    const client = cleanCell(row.client) || "거래처명 없음";
    const branchName = cleanCell(row.branch_name);
    const key = `${client}|${branchName}`;
    if (!ownerMap.has(owner)) ownerMap.set(owner, new Map());
    const itemMap = ownerMap.get(owner);
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        client,
        branchName,
        reportCount: 0,
        dates: [],
        types: [],
        amount: 0
      });
    }
    const item = itemMap.get(key);
    item.reportCount += 1;
    item.amount += Number(row.amount || 0);
    const date = cleanCell(row.report_date);
    if (date && !item.dates.includes(date)) item.dates.push(date);
    const type = cleanCell(row.type);
    if (type && !item.types.includes(type)) item.types.push(type);
  });

  return Array.from(ownerMap.entries())
    .map(([owner, itemMap]) => {
      const items = Array.from(itemMap.values())
        .map((item) => ({
          ...item,
          dates: item.dates.sort(),
          amountText: formatWon(item.amount)
        }))
        .sort((a, b) => {
          const ad = a.dates[0] || "";
          const bd = b.dates[0] || "";
          return ad.localeCompare(bd) || a.client.localeCompare(b.client, "ko");
        });
      return { owner, count: items.length, items };
    })
    .sort(ownerSort);
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");
    const key = requestUrl.searchParams.get("key") || "";

    if (req.method !== "GET") {
      return json(res, 405, { error: "Method not allowed" });
    }

    if (!ADMIN_KEY) {
      return json(res, 500, { error: "ADMIN_KEY 환경변수가 없습니다." });
    }

    if (key !== ADMIN_KEY) {
      return json(res, 401, { error: "관리자 비밀번호가 맞지 않습니다." });
    }

    const reports = await supabasePaged("reports?select=id,report_date,owner,client,branch_name,type,amount,client_code&order=report_date.asc");
    const owners = groupMissingReports(reports);

    return json(res, 200, {
      ok: true,
      message: "거래처코드가 아직 없는 보고 목록입니다.",
      total: owners.reduce((sum, owner) => sum + owner.count, 0),
      owners
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
