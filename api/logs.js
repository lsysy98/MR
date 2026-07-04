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

function reportLine(data) {
  if (!data) return "-";
  return [
    `담당자: ${data.owner || ""}`,
    `거래처: ${data.client || ""}`,
    `날짜: ${data.date || ""}`,
    `수거월: ${data.collectionYear || ""}.${String(data.collectionMonth || "").padStart(2, "0")}`,
    `구분: ${data.type || ""}`,
    `품목: ${data.product || ""}`,
    `금액: ${won(data.amount)}`,
    `처방입력: ${data.prescriptionDone ? "완료" : "미완료"}`
  ].join(" / ");
}

function changedFields(beforeData, afterData) {
  if (!beforeData || !afterData) return [];
  const labels = {
    owner: "담당자",
    client: "거래처",
    date: "날짜",
    collectionYear: "수거 연도",
    collectionMonth: "수거 월",
    type: "구분",
    product: "품목",
    amount: "금액",
    prescriptionDone: "처방입력"
  };
  return Object.keys(labels).filter((key) => beforeData[key] !== afterData[key]).map((key) => {
    const beforeValue = key === "amount" ? won(beforeData[key]) : beforeData[key];
    const afterValue = key === "amount" ? won(afterData[key]) : afterData[key];
    return `${labels[key]}: ${beforeValue ?? ""} → ${afterValue ?? ""}`;
  });
}

function page(rows) {
  const cards = rows.map((row) => {
    const beforeData = row.before_data || null;
    const afterData = row.after_data || null;
    const actionText = row.action === "delete" ? "삭제" : "수정";
    const actor = row.actor || afterData?.owner || beforeData?.owner || "-";
    const client = row.client || afterData?.client || beforeData?.client || "-";
    const changes = changedFields(beforeData, afterData);

    return `
      <article class="log-card">
        <div class="log-top">
          <strong>${esc(actionText)}</strong>
          <span>${esc(timeText(row.created_at))}</span>
        </div>
        <div class="main-line">
          <b>${esc(client)}</b>
          <span>${esc(actor)}</span>
        </div>
        ${row.action === "update" ? `
          <div class="block">
            <h3>바뀐 내용</h3>
            ${changes.length ? `<ul>${changes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p>변경된 항목을 찾지 못했습니다.</p>`}
          </div>
          <div class="two">
            <div class="block"><h3>수정 전</h3><p>${esc(reportLine(beforeData))}</p></div>
            <div class="block"><h3>수정 후</h3><p>${esc(reportLine(afterData))}</p></div>
          </div>
        ` : `
          <div class="block"><h3>삭제된 내용</h3><p>${esc(reportLine(beforeData))}</p></div>
        `}
      </article>
    `;
  }).join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>변경 기록</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f7f5; color: #17211c; font-family: "Malgun Gothic", system-ui, sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 18px 14px 32px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .sub { margin: 0 0 16px; color: #66736d; font-size: 14px; }
    .log-list { display: grid; gap: 12px; }
    .log-card { background: #fff; border: 1px solid #d9e2dc; border-radius: 8px; padding: 14px; box-shadow: 0 6px 16px rgba(27,45,37,.07); }
    .log-top { display: flex; justify-content: space-between; gap: 12px; color: #66736d; font-size: 13px; }
    .log-top strong { color: #14765c; font-size: 15px; }
    .main-line { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-top: 8px; padding-bottom: 10px; border-bottom: 1px solid #edf2ef; }
    .main-line b { font-size: 18px; }
    .main-line span { color: #66736d; font-weight: 800; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .block { margin-top: 10px; padding: 10px; border: 1px solid #e1e9e4; border-radius: 8px; background: #fbfdfc; }
    h3 { margin: 0 0 6px; font-size: 13px; color: #66736d; }
    p, ul { margin: 0; line-height: 1.55; font-size: 14px; }
    ul { padding-left: 18px; }
    li + li { margin-top: 3px; }
    .empty { padding: 28px; text-align: center; color: #66736d; background: #fff; border: 1px dashed #cbd8d1; border-radius: 8px; }
    @media (max-width: 720px) {
      .two { grid-template-columns: 1fr; }
      .main-line, .log-top { display: grid; }
      .main-line b { font-size: 17px; }
    }
  </style>
</head>
<body>
  <main>
    <h1>변경 기록</h1>
    <p class="sub">최근 수정/삭제 기록 ${rows.length}건</p>
    <div class="log-list">
      ${rows.length ? cards : `<div class="empty">아직 수정/삭제 기록이 없습니다.</div>`}
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
