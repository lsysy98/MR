const crypto = require("crypto");
const { analyzeCims } = require('../lib/cims-policy');

const DEFAULT_CIMS_SHEET_ID = "1ciVrJFqZyrXQvgBxZtSLwn9MxvOculLugDERIpHeEkY";
const DEFAULT_CIMS_SHEET_GID = "0";
const DEFAULT_STATS_SHEET_ID = "18g8f_EtcBQ7bMTg8rwnkHUsMxmHFAxoAz7hcF9weFm8";
const DEFAULT_STATS_SHEET_GID = "627148657";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;

const CIMS_SHEET_ID =
  process.env.CIMS_SHEET_ID ||
  process.env.CLIENT_DIRECTORY_SHEET_ID ||
  process.env.CLIENT_SHEET_ID ||
  process.env.GOOGLE_SHEET_ID ||
  DEFAULT_CIMS_SHEET_ID;
const CIMS_SHEET_GID =
  process.env.CIMS_SHEET_GID ||
  process.env.CLIENT_DIRECTORY_SHEET_GID ||
  process.env.CLIENT_SHEET_GID ||
  process.env.GOOGLE_SHEET_GID ||
  DEFAULT_CIMS_SHEET_GID;
const STATS_SHEET_ID =
  process.env.CLIENT_STATS_SHEET_ID ||
  process.env.PRESCRIPTION_STATS_SHEET_ID ||
  DEFAULT_STATS_SHEET_ID;
const STATS_SHEET_GID =
  process.env.CLIENT_STATS_SHEET_GID ||
  process.env.PRESCRIPTION_STATS_SHEET_GID ||
  DEFAULT_STATS_SHEET_GID;

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

function cleanCell(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalize(value) {
  return cleanCell(value).replace(/\s+/g, "").toLowerCase();
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTransientSupabaseErrorText(text) {
  return /<!doctype html|<html|cf-error-code|worker threw exception|cloudflare/i.test(String(text || ""));
}

function normalizeBranch(value) {
  return normalize(value)
    .replace(/[()（）\[\]{}]/g, "")
    .replace(/사업장명|사업장|영업소|지점명|지점|센터/g, "");
}

function normalizeClinicName(value) {
  return normalize(value)
    .replace(/[()（）\[\]{}]/g, "")
    .replace(/치과의원/g, "치과")
    .replace(/치과병원/g, "치과")
    .replace(/의원|병원/g, "");
}

function isCimsBranchAllowed(branch) {
  return /지점$/.test(cleanCell(branch));
}

function isClientAllowed(client) {
  return !normalize(client).includes("기공소");
}

function sha(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 24);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function findCimsHeaderIndex(rows) {
  return rows.findIndex((row, index) => {
    if (index > 20) return false;
    return /거래처코드|고객코드|코드/.test(normalize(row[0])) ||
      /거래처명|치과명|고객명/.test(normalize(row[1])) ||
      /사업장명|지점명/.test(normalize(row[10]));
  });
}

function rowsFromCimsCsv(text) {
  return analyzeCims(parseCsv(text)).allowed;
}

function rowsFromStatsCsv(text) {
  return parseCsv(text)
    .map((row, index) => ({
      index,
      code: cleanCell(row[2]),
      client: cleanCell(row[3]),
      branch: cleanCell(row[6]),
      owner: cleanCell(row[9])
    }))
    .filter((item) => {
      if (!item.code && !item.client && !item.branch && !item.owner) return false;
      if (item.index === 0 && /코드|거래처|치과|사업장|지점|담당/i.test(`${item.code} ${item.client} ${item.branch} ${item.owner}`)) return false;
      return Boolean(item.client || item.code || item.branch || item.owner);
    });
}

async function fetchSheetCsv(sheetId, sheetGid, label) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(sheetGid)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "sales-report-client-import" }
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${label} request failed: ${response.status}`);
    if (/<!doctype html|<html/i.test(text)) {
      throw new Error(`${label} 시트 공유 권한을 확인해주세요.`);
    }
    return text;
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`${label} 응답이 너무 늦습니다.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function supabase(path, options = {}) {
  const baseUrl = cleanSupabaseUrl();

  if (!baseUrl || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(baseUrl)) {
    throw new Error("SUPABASE_URL must look like https://xxxx.supabase.co");
  }

  const methodName = String(options.method || "GET").toUpperCase();
  const tableName = `${methodName} ${String(path).split("?")[0]}`;
  const attempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
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
      clearTimeout(timer);
      lastError = error.name === "AbortError"
        ? new Error(`Supabase 응답이 너무 늦습니다. (${tableName})`)
        : error;
      if (attempt < attempts) {
        await wait(350 * attempt);
        continue;
      }
      throw lastError;
    }

    clearTimeout(timer);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = text;
    }

    if (response.ok) return data;

    if (isTransientSupabaseErrorText(text)) {
      lastError = new Error(`Supabase가 일시 오류를 반환했습니다. 잠시 후 다시 실행해주세요. (${tableName}, HTTP ${response.status})`);
      if (attempt < attempts) {
        await wait(500 * attempt);
        continue;
      }
      throw lastError;
    }

    throw new Error(data?.message || text || `Supabase request failed. (${tableName})`);
  }

  throw lastError || new Error(`Supabase request failed. (${tableName})`);
}

function directoryRow(item, now) {
  const codeKey = normalize(item.code);
  const branchKey = normalizeBranch(item.branch);
  return {
    id: codeKey ? `code-${codeKey}` : `client-${sha(`${item.client}|${item.branch}`)}`,
    client_code: item.code || "",
    client_name: item.client,
    branch_name: item.branch,
    branch_key: branchKey,
    search_text: normalize(`${item.code} ${item.client} ${item.branch}`),
    sort_order: Number(item.index || 0),
    updated_at: now
  };
}

function ownerBranchRows(statsRows, now) {
  const seen = new Set();
  const rows = [];
  statsRows.forEach((item) => {
    const owner = cleanCell(item.owner);
    const branch = cleanCell(item.branch);
    const branchKey = normalizeBranch(branch);
    if (!owner || !branchKey) return;
    const key = `${normalize(owner)}|${branchKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      id: `owner-branch-${sha(key)}`,
      owner,
      branch_name: branch,
      branch_key: branchKey,
      updated_at: now
    });
  });
  return rows;
}

function existingClientRows(statsRows, now) {
  const seen = new Set();
  const rows = [];
  statsRows.forEach((item) => {
    const codeKey = normalize(item.code);
    const clientKey = normalizeClinicName(item.client);
    const branchKey = normalizeBranch(item.branch);
    if (!codeKey && !clientKey) return;
    const key = codeKey ? `code:${codeKey}` : `client:${clientKey}:${branchKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      id: codeKey ? `code-${codeKey}` : `client-${sha(`${item.client}|${item.branch}`)}`,
      client_code: item.code || "",
      client_name: item.client || "",
      branch_name: item.branch || "",
      branch_key: branchKey,
      owner: item.owner || "",
      updated_at: now
    });
  });
  return rows;
}


async function upsertRows(table, rows) {
  const size = 150;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    if (!chunk.length) continue;
    await supabase(`${table}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(chunk)
    });
  }
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");
    const key = String(req.headers?.authorization || '').replace(/^Bearer /, '') || requestUrl.searchParams.get("key") || "";

    if (req.method === "GET" && requestUrl.searchParams.get("mode") === "review") {
      const items = await supabase("rpc/preview_report_client_matches", { method: "POST", body: "{}" });
      res.setHeader("Cache-Control", "no-store");
      return json(res, 200, { ok: true, items });
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return json(res, 405, { error: "Method not allowed" });
    }

    if (!ADMIN_KEY) {
      return json(res, 500, { error: "ADMIN_KEY 환경변수가 없습니다." });
    }

    if (key !== ADMIN_KEY) {
      return json(res, 401, { error: "관리자 비밀번호가 맞지 않습니다." });
    }

    if (requestUrl.searchParams.get('mode') === 'cleanup') {
      return json(res, 410, { error: '사이트 내 거래처 정리 기능은 종료되었습니다. 기존 데이터는 변경하지 않았습니다.' });
    }

    const [cimsCsv, statsCsv] = await Promise.all([
      fetchSheetCsv(CIMS_SHEET_ID, CIMS_SHEET_GID, "CIMS"),
      fetchSheetCsv(STATS_SHEET_ID, STATS_SHEET_GID, "전체처방통계")
    ]);
    const now = Date.now();
    const cimsRows = rowsFromCimsCsv(cimsCsv);
    const statsRows = rowsFromStatsCsv(statsCsv);
    const directoryRows = cimsRows.map((item) => directoryRow(item, now));
    const branchRows = ownerBranchRows(statsRows, now);
    const existingRows = existingClientRows(statsRows, now);

    if (!directoryRows.length || !branchRows.length || !existingRows.length) throw new Error("시트가 비어 있어 기존 목록을 유지했습니다.");
    await upsertRows("client_directory", directoryRows);
    await supabase("rpc/replace_client_labels", { method: "POST", body: JSON.stringify({ p_branches: branchRows, p_existing: existingRows }) });
    const backfill = { updated: 0, mode: "preview_only", message: "기존 보고는 변경하지 않았습니다. 메뉴 > 코드확인 > 연결 변경 미리보기에서 확인해주세요." };

    return json(res, 200, {
      ok: true,
      message: "거래처 목록을 Supabase에 저장했습니다.",
      clientDirectoryCount: directoryRows.length,
      ownerBranchCount: branchRows.length,
      existingClientCount: existingRows.length,
      clientDirectoryMode: "upsert only",
      reportClientCodeBackfill: backfill,
      cimsRule: "지점 거래처 중 기공소, 폐업, 오스템 담당 거래처를 제외했습니다. 기존 검색 데이터는 자동 삭제하지 않습니다."
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
