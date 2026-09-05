const crypto = require("crypto");

const DEFAULT_CIMS_SHEET_ID = "1ciVrJFqZyrXQvgBxZtSLwn9MxvOculLugDERIpHeEkY";
const DEFAULT_CIMS_SHEET_GID = "0";
const DEFAULT_STATS_SHEET_ID = "18g8f_EtcBQ7bMTg8rwnkHUsMxmHFAxoAz7hcF9weFm8";
const DEFAULT_STATS_SHEET_GID = "627148657";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function cleanCell(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalize(value) {
  return cleanCell(value).replace(/\s+/g, "").toLowerCase();
}

function normalizeOwner(value) {
  return normalize(value);
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

function uniqueValues(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const clean = cleanCell(value);
    const key = normalize(clean);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(clean);
  });
  return result;
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

function isMissingSupabaseLookup(error) {
  return /client_directory|owner_branch_map|existing_clients|schema cache|relation .* does not exist|42P01/i.test(error?.message || "");
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
      if (!isClientAllowed(item.client)) return false;
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
  if (!sheetId) throw new Error(`${label} Google Sheet id is missing.`);

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(sheetGid)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "sales-report-cims-lookup" }
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

function branchMatchesScope(branch, branchScope) {
  if (!branchScope.length) return true;
  const branchKey = normalizeBranch(branch);
  return Boolean(branchKey && branchScope.some((scope) => {
    return branchKey === scope || branchKey.includes(scope) || scope.includes(branchKey);
  }));
}

function ownerBranchScope(owner, statsRows) {
  const ownerKey = normalizeOwner(owner);
  if (!ownerKey) return [];
  return uniqueValues(
    statsRows
      .filter((item) => normalizeOwner(item.owner) === ownerKey)
      .map((item) => item.branch)
  ).map(normalizeBranch).filter(Boolean);
}

function statsMatchClient(item, statsRows) {
  const code = normalize(item.code);
  const client = normalizeClinicName(item.client);
  const branch = normalizeBranch(item.branch);
  return statsRows.some((stat) => {
    const statCode = normalize(stat.code);
    const statClient = normalizeClinicName(stat.client);
    const statBranch = normalizeBranch(stat.branch);
    if (code && statCode && code === statCode) return true;
    if (!client || !statClient || client !== statClient) return false;
    if (!branch || !statBranch) return true;
    return branch === statBranch || branch.includes(statBranch) || statBranch.includes(branch);
  });
}

function annotateCimsRows(cimsRows, statsRows) {
  return cimsRows.map((item) => ({
    ...item,
    existing: statsMatchClient(item, statsRows)
  }));
}

function smallSample(rows, count = 5) {
  return rows.slice(0, count).map((item) => ({
    code: item.code || "",
    client: item.client || "",
    branch: item.branch || "",
    owner: item.owner || ""
  }));
}

function scopeCimsRows(cimsRows, ownerBranches) {
  const branchRows = ownerBranches.length
    ? cimsRows.filter((item) => branchMatchesScope(item.branch, ownerBranches))
    : cimsRows;

  return {
    rows: branchRows,
    branchMatchedCount: branchRows.length
  };
}

function scoreItem(item, query) {
  const client = normalize(item.client);
  const branch = normalize(item.branch);
  const code = normalize(item.code);

  if (code === query) return 0;
  if (code.startsWith(query)) return 1;
  if (client === query) return 2;
  if (client.startsWith(query)) return 3;
  if (client.includes(query)) return 4;
  if (branch.startsWith(query)) return 5;
  if (branch.includes(query)) return 6;
  if (code.includes(query)) return 7;
  return 9;
}

function formatItem(item) {
  return {
    code: item.code || "",
    client: item.client || "",
    branch: item.branch || "",
    existing: Boolean(item.existing)
  };
}

function existingKeySet(rows) {
  const keys = new Set();
  rows.forEach((row) => {
    const code = normalize(row.client_code || row.code);
    const client = normalizeClinicName(row.client_name || row.client);
    const branch = normalizeBranch(row.branch_name || row.branch);
    if (code) keys.add(`code:${code}`);
    if (client && branch) keys.add(`client-branch:${client}|${branch}`);
  });
  return keys;
}

function supabaseItemFromRow(row, existingKeys) {
  const code = row.client_code || "";
  const client = row.client_name || "";
  const branch = row.branch_name || "";
  return {
    index: Number(row.sort_order || 0),
    code,
    client,
    branch,
    existing: existingKeys.has(`code:${normalize(code)}`) ||
      existingKeys.has(`client-branch:${normalizeClinicName(client)}|${normalizeBranch(branch)}`)
  };
}

function clientDirectoryRowFromInput(input) {
  const client = cleanCell(input.client || input.clientName);
  const branch = cleanCell(input.branch || input.branchName);
  const code = cleanCell(input.code || input.clientCode);
  const branchKey = normalizeBranch(branch);
  const codeKey = normalize(code);
  if (!client) throw new Error("치과명을 입력해주세요.");
  if (!branch) throw new Error("지점을 입력해주세요.");

  return {
    id: codeKey ? `manual-code-${codeKey}` : `manual-${sha(`${client}|${branch}`)}`,
    client_code: code,
    client_name: client,
    branch_name: branch,
    branch_key: branchKey,
    search_text: normalize(`${code} ${client} ${branch}`),
    sort_order: 900000,
    updated_at: Date.now()
  };
}

async function saveManualClient(input) {
  const row = clientDirectoryRowFromInput(input);
  const rows = await supabase("client_directory?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row)
  });
  const saved = Array.isArray(rows) && rows[0] ? rows[0] : row;
  return {
    code: saved.client_code || "",
    client: saved.client_name || row.client_name,
    branch: saved.branch_name || row.branch_name,
    existing: false
  };
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

async function readSupabaseLookup(owner, query, includeAll, limit) {
  const readyRows = await supabase("client_directory?select=id&limit=1");
  if (!Array.isArray(readyRows) || !readyRows.length) {
    return { ok: true, ready: false, reason: "client_directory is empty" };
  }

  const ownerBranches = owner
    ? await supabase(`owner_branch_map?owner=eq.${encodeURIComponent(owner)}&select=branch_name,branch_key&order=branch_name.asc&limit=200`)
    : [];
  const branchKeys = ownerBranches
    .map((row) => normalizeBranch(row.branch_key || row.branch_name))
    .filter(Boolean);

  const filters = [
    "select=id,client_code,client_name,branch_name,branch_key,search_text,sort_order",
    "order=client_name.asc"
  ];

  if (branchKeys.length) {
    filters.push(`branch_key=in.(${branchKeys.map(encodeURIComponent).join(",")})`);
  }

  if (query) {
    filters.push(`search_text=ilike.*${encodeURIComponent(query)}*`);
  }

  const rowPath = `client_directory?${filters.join("&")}`;
  const directoryRows = includeAll
    ? await supabasePaged(rowPath)
    : await supabase(`${rowPath}&limit=${Math.max(50, limit * 3)}`);
  const existingRows = await supabasePaged("existing_clients?select=client_code,client_name");
  const existingKeys = existingKeySet(existingRows);
  let rows = directoryRows
    .filter((row) => isClientAllowed(row.client_name))
    .map((row) => supabaseItemFromRow(row, existingKeys));

  if (query) {
    rows = rows
      .filter((item) => {
        return normalize(item.client).includes(query) ||
          normalize(item.branch).includes(query) ||
          normalize(item.code).includes(query);
      })
      .sort((a, b) => scoreItem(a, query) - scoreItem(b, query) || a.index - b.index)
      .slice(0, limit);
  }

  return {
    ok: true,
    ready: true,
    source: "supabase",
    rows,
    ownerBranches: branchKeys,
    branchMatchedCount: directoryRows.length,
    directoryCount: directoryRows.length,
    existingCount: existingRows.length
  };
}

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");
    const query = normalize(requestUrl.searchParams.get("q"));
    const includeAll = requestUrl.searchParams.get("all") === "1";
    const owner = cleanCell(requestUrl.searchParams.get("owner"));
    const limit = Math.max(1, Math.min(50, Number(requestUrl.searchParams.get("limit") || 20)));

    if (req.method === "POST") {
      const item = await saveManualClient(await readBody(req));
      return json(res, 201, { ok: true, item });
    }

    if (req.method !== "GET") {
      return json(res, 405, { error: "Method not allowed" });
    }

    const supabaseResult = await readSupabaseLookup(owner, query, includeAll, limit)
      .catch((error) => ({ ok: false, ready: false, error }));

    if (supabaseResult.ok && supabaseResult.ready) {
      if (requestUrl.searchParams.get("debug") === "1") {
        return json(res, 200, {
          ok: true,
          source: "supabase",
          supabaseLookupReady: true,
          cimsVisibleCount: supabaseResult.rows.length,
          cimsAfterOwnerBranchFilter: supabaseResult.branchMatchedCount,
          existingClientCount: supabaseResult.existingCount,
          owner,
          ownerBranches: supabaseResult.ownerBranches,
          sample: smallSample(supabaseResult.rows),
          message: "Supabase 거래처목록을 사용합니다. CIMS에서 K열이 지점으로 끝나는 거래처만 저장했고, 담당자별 지점은 전체처방통계 G/J 기준입니다."
        });
      }

      if (includeAll) {
        return json(res, 200, {
          items: supabaseResult.rows.map(formatItem),
          count: supabaseResult.rows.length,
          source: "supabase",
          cimsLoaded: true,
          statsLoaded: true
        });
      }

      if (!query) {
        return json(res, 200, {
          items: [],
          count: 0,
          source: "supabase",
          cimsLoaded: true,
          statsLoaded: true
        });
      }

      return json(res, 200, {
        items: supabaseResult.rows.map(formatItem),
        count: supabaseResult.rows.length,
        source: "supabase",
        cimsLoaded: true,
        statsLoaded: true
      });
    }

    const cimsCsv = await fetchSheetCsv(CIMS_SHEET_ID, CIMS_SHEET_GID, "CIMS");
    const statsResult = await fetchSheetCsv(STATS_SHEET_ID, STATS_SHEET_GID, "전체처방통계")
      .then((csv) => ({ ok: true, rows: rowsFromStatsCsv(csv) }))
      .catch((error) => ({ ok: false, rows: [], error }));
    const cimsRows = rowsFromCimsCsv(cimsCsv);
    const ownerBranches = ownerBranchScope(owner, statsResult.rows);
    const scoped = scopeCimsRows(cimsRows, ownerBranches);
    const rows = annotateCimsRows(scoped.rows, statsResult.rows);

    if (requestUrl.searchParams.get("debug") === "1") {
      return json(res, 200, {
        ok: true,
        cimsLoaded: true,
        cimsTotal: cimsRows.length,
        cimsAfterOwnerBranchFilter: scoped.branchMatchedCount,
        cimsVisibleCount: rows.length,
        cimsSheetIdStart: CIMS_SHEET_ID.slice(0, 10),
        statsLoaded: statsResult.ok,
        statsCount: statsResult.rows.length,
        statsError: statsResult.ok ? "" : statsResult.error?.message || "전체처방통계 연결 실패",
        supabaseLookupReady: false,
        supabaseLookupError: supabaseResult.ok ? supabaseResult.reason || "" : supabaseResult.error?.message || "",
        supabaseMissingTable: supabaseResult.ok ? false : isMissingSupabaseLookup(supabaseResult.error),
        owner: owner,
        ownerBranches: ownerBranches,
        cimsSample: smallSample(cimsRows),
        statsOwnerSample: smallSample(statsResult.rows.filter((item) => normalizeOwner(item.owner) === normalizeOwner(owner))),
        message: "전체처방통계 G/J로 담당자별 지점을 파악한 뒤, CIMS K열 지점이 맞는 거래처를 입력 후보로 사용합니다. CIMS 담당자명은 보지 않습니다."
      });
    }

    if (includeAll) {
      return json(res, 200, {
        items: rows.map(formatItem),
        count: rows.length,
        cimsLoaded: true,
        statsLoaded: statsResult.ok
      });
    }

    if (!query) {
      return json(res, 200, { items: [], count: 0, cimsLoaded: true, statsLoaded: statsResult.ok });
    }

    const filtered = rows
      .filter((item) => {
        return normalize(item.client).includes(query) ||
          normalize(item.branch).includes(query) ||
          normalize(item.code).includes(query);
      })
      .sort((a, b) => scoreItem(a, query) - scoreItem(b, query) || a.index - b.index);

    return json(res, 200, {
      items: filtered.slice(0, limit).map(formatItem),
      count: filtered.length,
      cimsLoaded: true,
      statsLoaded: statsResult.ok
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
