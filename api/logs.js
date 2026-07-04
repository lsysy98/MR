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

function html(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(body);
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

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function won(value) {
  const number = Number(value || 0);
  return number.toLocaleString("ko-KR") + "원";
}

function timeText(value) {
  const date = new Date(Number(value || Date.now()));
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function collectionText(data) {
  if (!data?.collectionYear || !data?.collectionMonth) return "";
  return `${data.collectionYear}.${String(data.collectionMonth).padStart(2, "0")}`;
}

function reportLine(data) {
  if (!data) return "-";
  return [
    `담당자: ${data.owner || ""}`,
    `거래처: ${data.client || ""}`,
    data.branchName ? `지점: ${data.branchName}` : "",
    `날짜: ${data.date || ""}`,
    `수거월: ${collectionText(data)}`,
    `구분: ${data.type || ""}`,
    `품목: ${data.product || ""}`,
    `금액: ${won(data.amount)}`,
    `통계입력: ${data.prescriptionDone ? "완료" : "미완료"}`
  ].filter(Boolean).join(" / ");
}

function displayValue(key, value) {
  if (key === "amount") return won(value);
  if (key === "prescriptionDone") return value ? "완료" : "미완료";
  return value ?? "";
}

function changedFields(beforeData, afterData) {
  if (!beforeData || !afterData) return [];
  const labels = {
    owner: "담당자",
    client: "거래처",
    branchName: "지점명",
    date: "날짜",
    collectionYear: "수거 연도",
    collectionMonth: "수거 월",
    type: "구분",
    product: "품목",
    amount: "금액",
    prescriptionDone: "통계입력"
  };
  return Object.keys(labels).filter((key) => beforeData[key] !== afterData[key]).map((key) => {
    return `${labels[key]}: ${displayValue(key, beforeData[key])} → ${displayValue(key, afterData[key])}`;
  });
}

function logCard(row) {
  const beforeData = row.before_data || null;
  const afterData = row.after_data || null;
  const actionText = row.action === "delete" ? "삭제" : "수정";
  const actor = row.actor || afterData?.owner || beforeData?.owner || "-";
  const client = row.client || afterData?.client || beforeData?.client || "-";
  const changes = changedFields(beforeData, afterData);

  return `
    <details class="log-card">
      <summary>
        <span class="action ${row.action === "delete" ? "delete" : "update"}">${esc(actionText)}</span>
        <strong>${esc(client)}</strong>
        <span>${esc(actor)}</span>
        <time>${esc(timeText(row.created_at))}</time>
      </summary>
      <div class="detail-body">
        ${row.action === "update" ? `
          <section>
            <h2>바뀐 내용</h2>
            ${changes.length ? `<ul>${changes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>변경된 항목을 찾지 못했습니다.</p>`}
          </section>
          <div class="two">
            <section><h2>수정 전</h2><p>${esc(reportLine(beforeData))}</p></section>
            <section><h2>수정 후</h2><p>${esc(reportLine(afterData))}</p></section>
          </div>
        ` : `
          <section><h2>삭제된 내용</h2><p>${esc(reportLine(beforeData))}</p></section>
        `}
      </div>
    </details>
  `;
}

function page(rows) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>변경 기록</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f7f5; color: #17211c; font-family: "Malgun Gothic", system-ui, sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 16px 12px 28px; }
    h1 { margin: 0 0 5px; font-size: 22px; }
    .sub { margin: 0 0 12px; color: #66736d; font-size: 13px; }
    .log-list { display: grid; gap: 7px; }
    .log-card { background: #fff; border: 1px solid #d9e2dc; border-radius: 8px; box-shadow: 0 4px 12px rgba(27,45,37,.05); overflow: hidden; }
    summary { min-height: 42px; display: grid; grid-template-columns: 42px minmax(100px, 1fr) 74px 134px; gap: 8px; align-items: center; padding: 8px 10px; cursor: pointer; list-style: none; }
    summary::-webkit-details-marker { display: none; }
    .action { justify-self: start; border-radius: 999px; padding: 4px 7px; font-size: 12px; font-weight: 900; }
    .action.update { background: #e6f5ef; color: #14765c; }
    .action.delete { background: #fff1f1; color: #c24141; }
    summary strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
    summary span:not(.action), time { color: #66736d; font-size: 13px; white-space: nowrap; }
    time { text-align: right; }
    .detail-body { border-top: 1px solid #edf2ef; padding: 9px; display: grid; gap: 8px; }
    section { padding: 9px; border: 1px solid #e1e9e4; border-radius: 8px; background: #fbfdfc; }
    h2 { margin: 0 0 5px; font-size: 13px; color: #66736d; }
    p, ul { margin: 0; line-height: 1.55; font-size: 13px; }
    ul { padding-left: 18px; }
    li + li { margin-top: 3px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .empty { padding: 24px; text-align: center; color: #66736d; background: #fff; border: 1px dashed #cbd8d1; border-radius: 8px; }
    @media (max-width: 720px) {
      summary { grid-template-columns: 40px minmax(82px, 1fr) 58px; }
      time { grid-column: 2 / -1; text-align: left; font-size: 12px; }
      .two { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <h1>변경 기록</h1>
    <p class="sub">최근 수정/삭제 기록 ${rows.length}건</p>
    <div class="log-list">
      ${rows.length ? rows.map(logCard).join("") : `<div class="empty">아직 수정/삭제 기록이 없습니다.</div>`}
    </div>
  </main>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  try {
    if (!requireAdmin(req)) return json(res, 401, { error: "Unauthorized" });
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const requestUrl = new URL(req.url, "http://localhost");
    const rows = await supabase("report_logs?select=*&order=created_at.desc&limit=200");
    if (requestUrl.searchParams.get("format") === "json") {
      return json(res, 200, rows);
    }
    return html(res, 200, page(rows));
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
};
