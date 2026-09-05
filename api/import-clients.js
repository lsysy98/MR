const crypto = require("crypto");

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

function normalizeBranch(value) {
  return normalize(value)
    .replace(/[()（）\[\]{}]/g, "")
    .replace(/사업장명|사업장|영업소|지점명|지점|센터/g, "");
}

function normalizeClinicName(value) {
  return normalize(value)
    .replace(/[()（）\[\]{}]/g, "")
    .replace(/치과의원|치과병원|의원|병원/g, "");
}

function isCimsBranchAllowed(branch) {
  return /지점$/.test(cleanCell(branch));
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
  const rawRows = parseCsv(text).map((row) => row.map(cleanCell));
  const headerIndex = findCimsHeaderIndex(rawRows);
  const seen = new Set();
  return rawRows
    .map((row, index) => ({
      index,
      code: cleanCell(row[0]),
      client: cleanCell(row[1]),
      branch: cleanCell(row[10])
    }))
    .filter((item) => {
      if (item.index === headerIndex) return false;
      if (!item.client) return false;
      if (!isCimsBranchAllowed(item.branch)) return false;
      const key = item.code ? `code:${normalize(item.code)}` : `client:${normalize(item.client)}:${normalize(item.branch)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

function reportClientLooksLikeDirectoryItem(reportClient, directoryItem) {
  const reportKey = normalizeClinicName(reportClient);
  const clientKey = normalizeClinicName(directoryItem && directoryItem.client_name);
  const branchKey = normalizeBranch(directoryItem && directoryItem.branch_name);
  const branchTextKey = normalize(directoryItem && directoryItem.branch_name);
  if (!reportKey || !clientKey) return false;
  if (reportKey === clientKey) return true;
  if (!branchKey) return false;
  return reportKey === branchTextKey + clientKey ||
    reportKey === clientKey + branchTextKey ||
    (reportKey.includes(clientKey) && reportKey.includes(branchKey));
}

function branchLooksSame(a, b) {
  const left = normalizeBranch(a);
  const right = normalizeBranch(b);
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function buildOwnerBranchMap(branchRows) {
  return branchRows.reduce((map, row) => {
    const ownerKey = normalize(row.owner);
    if (!ownerKey) return map;
    if (!map.has(ownerKey)) map.set(ownerKey, new Set());
    map.get(ownerKey).add(row.branch_key);
    return map;
  }, new Map());
}

function uniqueByCode(matches) {
  const byCode = new Map();
  matches.forEach((item) => {
    const code = normalize(item.client_code);
    if (code) byCode.set(code, item);
  });
  if (byCode.size === 1) return Array.from(byCode.values())[0];
  if (!byCode.size && matches.length === 1) return matches[0];
  return null;
}

function scoreReportMatch(report, item) {
  const reportKey = normalizeClinicName(report.client);
  const clientKey = normalizeClinicName(item && item.client_name);
  const reportBranch = normalizeBranch(report.branch_name);
  const itemBranch = normalizeBranch(item && item.branch_name);
  if (!reportKey || !clientKey) return 99;
  if (reportKey === clientKey && reportBranch && itemBranch && branchLooksSame(itemBranch, reportBranch)) return 0;
  if (reportKey === clientKey) return 1;
  if (reportClientLooksLikeDirectoryItem(report.client, item) && reportBranch && itemBranch && branchLooksSame(itemBranch, reportBranch)) return 2;
  if (reportClientLooksLikeDirectoryItem(report.client, item)) return 3;
  return 99;
}

function bestUniqueMatch(report, matches) {
  if (!matches.length) return null;
  const scored = matches
    .map((item) => ({ item, score: scoreReportMatch(report, item) }))
    .filter((row) => row.score < 99)
    .sort((a, b) => a.score - b.score);
  if (!scored.length) return null;
  const bestScore = scored[0].score;
  return uniqueByCode(scored.filter((row) => row.score === bestScore).map((row) => row.item));
}

function rowsForReportOwner(report, rows, ownerBranchMap) {
  const ownerKey = normalize(report.owner);
  const exactOwnerRows = ownerKey
    ? rows.filter((item) => normalize(item.owner) === ownerKey)
    : [];
  if (exactOwnerRows.length) return exactOwnerRows;

  const ownerBranches = ownerBranchMap.get(ownerKey) || new Set();
  return ownerBranches.size
    ? rows.filter((item) => ownerBranches.has(item.branch_key))
    : rows;
}

function uniqueExistingReportMatch(report, existingRows, ownerBranchMap) {
  if (!report || cleanCell(report.client_code)) return null;
  let matches = rowsForReportOwner(report, existingRows, ownerBranchMap)
    .filter((item) => reportClientLooksLikeDirectoryItem(report.client, item));
  if (!matches.length) return null;

  if (report.branch_name) {
    const branchMatches = matches.filter((item) => branchLooksSame(item.branch_name, report.branch_name));
    if (branchMatches.length) matches = branchMatches;
  }

  return bestUniqueMatch(report, matches);
}

function uniqueReportMatch(report, directoryRows, ownerBranchMap) {
  if (!report || cleanCell(report.client_code)) return null;
  const ownerBranches = ownerBranchMap.get(normalize(report.owner)) || new Set();
  const ownerScoped = ownerBranches.size
    ? directoryRows.filter((item) => ownerBranches.has(item.branch_key))
    : directoryRows;
  let matches = ownerScoped.filter((item) => reportClientLooksLikeDirectoryItem(report.client, item));
  if (!matches.length) return null;

  if (report.branch_name) {
    const branchMatches = matches.filter((item) => branchLooksSame(item.branch_name, report.branch_name));
    if (branchMatches.length) matches = branchMatches;
  }

  return bestUniqueMatch(report, matches);
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

async function backfillReportClientCodes(directoryRows, branchRows, existingRows) {
  const reportRows = await supabasePaged("reports?select=id,owner,client,branch_name,client_code&order=created_at.asc");
  const ownerBranchMap = buildOwnerBranchMap(branchRows);
  let updated = 0;
  let ambiguous = 0;
  let skipped = 0;
  let existingMatched = 0;
  let directoryMatched = 0;
  const unresolvedSamples = [];

  for (const report of reportRows) {
    if (cleanCell(report.client_code)) {
      skipped += 1;
      continue;
    }
    let source = "existing";
    let match = uniqueExistingReportMatch(report, existingRows, ownerBranchMap);
    if (!match) {
      source = "directory";
      match = uniqueReportMatch(report, directoryRows, ownerBranchMap);
    }
    if (!match) {
      ambiguous += 1;
      if (unresolvedSamples.length < 20) {
        unresolvedSamples.push({
          owner: report.owner || "",
          client: report.client || "",
          branchName: report.branch_name || ""
        });
      }
      continue;
    }
    await supabase(`reports?id=eq.${encodeURIComponent(report.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        client_code: match.client_code || "",
        branch_name: report.branch_name || match.branch_name || ""
      })
    });
    updated += 1;
    if (source === "existing") existingMatched += 1;
    else directoryMatched += 1;
  }

  return { total: reportRows.length, updated, existingMatched, directoryMatched, ambiguous, skipped, unresolvedSamples };
}

async function clearTable(table) {
  await supabase(`${table}?id=neq.__never__`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" }
  });
}

async function upsertRows(table, rows) {
  const size = 400;
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
    const key = requestUrl.searchParams.get("key") || "";

    if (req.method !== "GET" && req.method !== "POST") {
      return json(res, 405, { error: "Method not allowed" });
    }

    if (!ADMIN_KEY) {
      return json(res, 500, { error: "ADMIN_KEY 환경변수가 없습니다." });
    }

    if (key !== ADMIN_KEY) {
      return json(res, 401, { error: "관리자 비밀번호가 맞지 않습니다." });
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

    await clearTable("client_directory");
    await clearTable("owner_branch_map");
    await clearTable("existing_clients");

    await upsertRows("client_directory", directoryRows);
    await upsertRows("owner_branch_map", branchRows);
    await upsertRows("existing_clients", existingRows);
    const backfill = await backfillReportClientCodes(directoryRows, branchRows, existingRows);

    return json(res, 200, {
      ok: true,
      message: "거래처 목록을 Supabase에 저장했습니다.",
      clientDirectoryCount: directoryRows.length,
      ownerBranchCount: branchRows.length,
      existingClientCount: existingRows.length,
      reportClientCodeBackfill: backfill,
      cimsRule: "CIMS K열이 지점으로 끝나는 거래처만 저장했습니다."
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
