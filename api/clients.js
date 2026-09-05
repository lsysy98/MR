const DEFAULT_DIRECTORY_SHEET_ID = "1ciVrJFqZyrXQvgBxZtSLwn9MxvOculLugDERIpHeEkY";
const DEFAULT_DIRECTORY_SHEET_GID = "0";
const DEFAULT_STATS_SHEET_ID = "18g8f_EtcBQ7bMTg8rwnkHUsMxmHFAxoAz7hcF9weFm8";
const DEFAULT_STATS_SHEET_GID = "627148657";

const DIRECTORY_SHEET_ID =
  process.env.CLIENT_DIRECTORY_SHEET_ID ||
  process.env.CLIENT_SHEET_ID ||
  process.env.GOOGLE_SHEET_ID ||
  DEFAULT_DIRECTORY_SHEET_ID;
const DIRECTORY_SHEET_GID =
  process.env.CLIENT_DIRECTORY_SHEET_GID ||
  process.env.CLIENT_SHEET_GID ||
  process.env.GOOGLE_SHEET_GID ||
  DEFAULT_DIRECTORY_SHEET_GID;
const STATS_SHEET_ID =
  process.env.CLIENT_STATS_SHEET_ID ||
  process.env.PRESCRIPTION_STATS_SHEET_ID ||
  DEFAULT_STATS_SHEET_ID;
const STATS_SHEET_GID =
  process.env.CLIENT_STATS_SHEET_GID ||
  process.env.PRESCRIPTION_STATS_SHEET_GID ||
  DEFAULT_STATS_SHEET_GID;

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.end(JSON.stringify(data));
}

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, "").toLowerCase();
}

function normalizeOwner(value) {
  return normalize(value);
}

function normalizeBranch(value) {
  return normalize(value).replace(/지점$/g, "");
}

function branchScopeFromRequest(requestUrl) {
  return String(requestUrl.searchParams.get("branches") || "")
    .split(",")
    .map(normalizeBranch)
    .filter(Boolean);
}

function matchesBranchScope(item, branchScope) {
  if (!branchScope.length) return true;
  const branch = normalizeBranch(item.branch);
  return Boolean(branch && branchScope.some((scope) => branch === scope || branch.includes(scope) || scope.includes(branch)));
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

function cleanCell(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
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

function directoryRowsFromCsv(text) {
  return parseCsv(text)
    .map((row, index) => ({
      index,
      code: cleanCell(row[0]),
      client: cleanCell(row[1]),
      branch: cleanCell(row[10]),
      owners: [],
      existing: false,
      source: "directory"
    }))
    .filter((item) => {
      if (!item.code && !item.client) return false;
      if (item.index === 0 && /코드|거래처|치과|사업장|지점/i.test(`${item.code} ${item.client} ${item.branch}`)) return false;
      return Boolean(item.client);
    });
}

function findColumn(header, names) {
  const keys = names.map(normalize);
  for (let i = 0; i < header.length; i += 1) {
    const key = normalize(header[i]);
    if (keys.some((name) => key === name || key.includes(name))) return i;
  }
  return -1;
}

function statsRowsFromCsv(text) {
  const rawRows = parseCsv(text)
    .map((row) => row.map(cleanCell))
    .filter((row) => row.some(Boolean));
  const headerIndex = rawRows.findIndex((row) => {
    const joined = row.map(normalize).join("|");
    return /거래처|치과/.test(joined) && /담당|mr|사업장|지점|코드/.test(joined);
  });
  if (headerIndex < 0) return [];

  const header = rawRows[headerIndex];
  const clientIndex = findColumn(header, ["거래처명", "치과명", "거래처"]);
  const branchIndex = findColumn(header, ["사업장명", "지점명", "지점", "사업장"]);
  const ownerIndex = findColumn(header, ["MR담당자명", "담당자명", "담당자", "MR"]);
  const codeIndex = findColumn(header, ["거래처코드", "거래처 코드", "코드"]);
  if (clientIndex < 0) return [];

  return rawRows.slice(headerIndex + 1)
    .map((row, offset) => ({
      index: headerIndex + offset + 1,
      code: codeIndex >= 0 ? cleanCell(row[codeIndex]) : "",
      client: cleanCell(row[clientIndex]),
      branch: branchIndex >= 0 ? cleanCell(row[branchIndex]) : "",
      owner: ownerIndex >= 0 ? cleanCell(row[ownerIndex]) : "",
      owners: ownerIndex >= 0 ? [cleanCell(row[ownerIndex])].filter(Boolean) : [],
      existing: true,
      source: "stats"
    }))
    .filter((item) => Boolean(item.client));
}

async function fetchSheetCsv(sheetId, sheetGid, label) {
  if (!sheetId) throw new Error(`${label} Google Sheet id is missing.`);

  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(sheetGid)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "sales-report-client-lookup" }
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Google Sheet request failed: ${response.status}`);
    }
    if (/<!doctype html|<html/i.test(text)) {
      throw new Error(`${label} Google Sheet sharing is not open to link viewers.`);
    }
    return text;
  } catch (error) {
    if (error.name === "AbortError") throw new Error(`${label} Google Sheet response timed out.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function sameClient(a, b) {
  return Boolean(normalize(a) && normalize(a) === normalize(b));
}

function branchLooksSame(a, b) {
  const left = normalizeBranch(a);
  const right = normalizeBranch(b);
  return Boolean(left && right && (left === right || left.includes(right) || right.includes(left)));
}

function statMatchesItem(stat, item) {
  if (!sameClient(stat.client, item.client)) return false;
  if (!stat.branch || !item.branch) return true;
  return branchLooksSame(stat.branch, item.branch);
}

function mergeClientRows(directoryRows, statsRows) {
  const rows = directoryRows.map((item) => {
    const matches = statsRows.filter((stat) => statMatchesItem(stat, item));
    return {
      ...item,
      existing: matches.length > 0,
      owners: uniqueValues(matches.flatMap((stat) => stat.owners || []))
    };
  });

  statsRows.forEach((stat) => {
    const alreadyExists = rows.some((item) => statMatchesItem(stat, item));
    if (alreadyExists) return;
    rows.push({
      code: stat.code || "",
      client: stat.client,
      branch: stat.branch || "",
      owners: uniqueValues(stat.owners || []),
      existing: true,
      source: "stats",
      index: 100000 + stat.index
    });
  });

  const seen = new Set();
  return rows.filter((item) => {
    const key = item.code ? `code:${normalize(item.code)}` : `client:${normalize(item.client)}:${normalizeBranch(item.branch)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function branchScopeForOwner(owner, statsRows) {
  const ownerKey = normalizeOwner(owner);
  if (!ownerKey) return [];
  return uniqueValues(
    statsRows
      .filter((item) => normalizeOwner(item.owner) === ownerKey)
      .map((item) => item.branch)
  ).map(normalizeBranch).filter(Boolean);
}

function matchesOwnerScope(item, owner, branchScope) {
  if (!branchScope.length) return true;
  if (matchesBranchScope(item, branchScope)) return true;
  const ownerKey = normalizeOwner(owner);
  return Boolean(ownerKey && (item.owners || []).some((name) => normalizeOwner(name) === ownerKey));
}

function formatItem(item) {
  return {
    code: item.code || "",
    client: item.client || "",
    branch: item.branch || "",
    existing: Boolean(item.existing),
    owners: uniqueValues(item.owners || [])
  };
}

function scoreItem(item, query, codeQuery) {
  const client = normalize(item.client);
  const branch = normalize(item.branch);
  const code = normalize(item.code);

  if (codeQuery) {
    if (code === codeQuery) return 0;
    if (code.startsWith(codeQuery)) return 1;
    if (code.includes(codeQuery)) return 2;
    return 9;
  }

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

module.exports = async function handler(req, res) {
  try {
    const requestUrl = new URL(req.url, "http://localhost");
    const query = normalize(requestUrl.searchParams.get("q"));
    const codeQuery = normalize(requestUrl.searchParams.get("code"));
    const includeAll = requestUrl.searchParams.get("all") === "1";
    const owner = cleanCell(requestUrl.searchParams.get("owner"));
    const manualBranchScope = branchScopeFromRequest(requestUrl);
    const limit = Math.max(1, Math.min(30, Number(requestUrl.searchParams.get("limit") || 12)));

    if (req.method !== "GET") {
      return json(res, 405, { error: "Method not allowed" });
    }
    const directoryResult = await fetchSheetCsv(DIRECTORY_SHEET_ID, DIRECTORY_SHEET_GID, "Client directory")
      .then((csv) => ({ ok: true, rows: directoryRowsFromCsv(csv) }))
      .catch((error) => ({ ok: false, rows: [], error }));
    const statsResult = await fetchSheetCsv(STATS_SHEET_ID, STATS_SHEET_GID, "Prescription stats")
      .then((csv) => ({ ok: true, rows: statsRowsFromCsv(csv) }))
      .catch((error) => ({ ok: false, rows: [], error }));

    if (!directoryResult.ok && !statsResult.ok) {
      throw directoryResult.error || statsResult.error || new Error("Google Sheet request failed.");
    }

    const ownerBranchScope = branchScopeForOwner(owner, statsResult.rows);
    const branchScope = uniqueValues(manualBranchScope.concat(ownerBranchScope)).map(normalizeBranch);
    const rows = mergeClientRows(directoryResult.rows, statsResult.rows)
      .filter((item) => matchesOwnerScope(item, owner, branchScope));

    if (includeAll) {
      return json(res, 200, {
        items: rows.map(formatItem),
        count: rows.length,
        statsLoaded: statsResult.ok
      });
    }

    if (!query && !codeQuery) {
      return json(res, 200, { items: [], count: 0 });
    }

    const filtered = rows
      .filter((item) => {
        if (codeQuery) return normalize(item.code).includes(codeQuery);
        return normalize(item.client).includes(query) ||
          normalize(item.branch).includes(query) ||
          normalize(item.code).includes(query);
      })
      .sort((a, b) => scoreItem(a, query, codeQuery) - scoreItem(b, query, codeQuery) || a.index - b.index);

    return json(res, 200, {
      items: filtered.slice(0, limit).map(formatItem),
      count: filtered.length,
      statsLoaded: statsResult.ok
    });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
