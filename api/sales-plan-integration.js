const SALES_PLAN_INTEGRATION_URL = process.env.SALES_PLAN_INTEGRATION_URL || "";
const SALES_PLAN_INTEGRATION_API_KEY = process.env.SALES_PLAN_INTEGRATION_API_KEY || "";
const OUTBOX_TABLE = "sales_plan_integration_outbox";

function hasSalesPlanConfig() {
  return Boolean(SALES_PLAN_INTEGRATION_URL.trim() && SALES_PLAN_INTEGRATION_API_KEY.trim());
}

function codedError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function collectionMonthText(report) {
  const year = Number(report.collectionYear || 0);
  const month = Number(report.collectionMonth || 0);
  if (!year || !month) return "";
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildSalesPlanPayload(action, report, updatedAt) {
  const reportId = String(report.id || report.reportId || "");
  const eventUpdatedAt = Number(updatedAt || report.updatedAt || Date.now());

  if (action === "delete") {
    return {
      dataType: "daily_report",
      action: "delete",
      reportId,
      deleted: true,
      updatedAt: eventUpdatedAt
    };
  }

  const payload = {
    dataType: "daily_report",
    action: "create_or_update",
    reportId,
    owner: report.owner || "",
    date: report.date || "",
    clientName: report.client || report.clientName || "",
    clientCode: String(report.clientCode || ""),
    type: report.type || "",
    product: report.product || "",
    amount: Number(report.amount || 0),
    updatedAt: eventUpdatedAt
  };
  if (report.branchName) payload.branchName = report.branchName;
  const collectionMonth = collectionMonthText(report);
  if (collectionMonth) payload.collectionMonth = collectionMonth;
  return payload;
}

function eventId(payload) {
  return `${payload.reportId}:${payload.action}:${payload.updatedAt}`;
}

function errorCode(error) {
  return error && error.code ? String(error.code) : "integration_error";
}

async function postSalesPlanPayload(payload) {
  const url = SALES_PLAN_INTEGRATION_URL.trim();
  const apiKey = SALES_PLAN_INTEGRATION_API_KEY.trim();
  if (!url || !apiKey) {
    throw codedError("missing_config", "SALES_PLAN_INTEGRATION_URL 또는 SALES_PLAN_INTEGRATION_API_KEY가 없습니다.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw codedError("network_timeout", "영업계획서 연동 요청 시간이 초과되었습니다.");
    }
    throw codedError("network_error", error.message);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw codedError("invalid_response", text || "영업계획서 응답이 JSON 형식이 아닙니다.");
  }

  if (!response.ok) {
    throw codedError(`http_${response.status}`, data?.error || data?.message || text || "영업계획서 서버 오류");
  }
  if (!data || data.ok !== true) {
    throw codedError(data?.error || "remote_rejected", data?.error || "영업계획서 서버가 실패 응답을 반환했습니다.");
  }
  return data;
}

async function savePendingEvent(supabase, payload, error) {
  const now = Date.now();
  try {
    await supabase(`${OUTBOX_TABLE}?on_conflict=event_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        event_id: eventId(payload),
        report_id: payload.reportId,
        action: payload.action,
        payload,
        status: "pending",
        attempt_count: 1,
        last_error_code: errorCode(error),
        last_error: error?.message || String(error || ""),
        last_attempt_at: now,
        created_at: now,
        updated_at: now
      })
    });
  } catch (outboxError) {
    console.warn("sales plan integration outbox skipped:", outboxError.message);
  }
}

async function markDelivered(supabase, row) {
  try {
    await supabase(`${OUTBOX_TABLE}?event_id=eq.${encodeURIComponent(row.event_id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "delivered",
        attempt_count: Number(row.attempt_count || 0) + 1,
        last_error_code: "",
        last_error: "",
        last_attempt_at: Date.now(),
        delivered_at: Date.now(),
        updated_at: Date.now()
      })
    });
  } catch (error) {
    console.warn("sales plan integration delivered mark skipped:", error.message);
  }
}

async function markRetryFailed(supabase, row, error) {
  try {
    await supabase(`${OUTBOX_TABLE}?event_id=eq.${encodeURIComponent(row.event_id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "pending",
        attempt_count: Number(row.attempt_count || 0) + 1,
        last_error_code: errorCode(error),
        last_error: error?.message || String(error || ""),
        last_attempt_at: Date.now(),
        updated_at: Date.now()
      })
    });
  } catch (outboxError) {
    console.warn("sales plan integration retry log skipped:", outboxError.message);
  }
}

async function retryPendingSalesPlanEvents(supabase, limit = 3) {
  if (!hasSalesPlanConfig()) {
    return { attempted: 0, delivered: 0, failed: 0, skipped: "missing_config" };
  }

  let rows = [];
  try {
    rows = await supabase(`${OUTBOX_TABLE}?status=eq.pending&select=*&order=created_at.asc&limit=${Number(limit) || 3}`);
  } catch (error) {
    console.warn("sales plan integration retry skipped:", error.message);
    return { attempted: 0, delivered: 0, failed: 0, skipped: "outbox_unavailable" };
  }

  const result = { attempted: 0, delivered: 0, failed: 0 };
  for (const row of rows) {
    result.attempted += 1;
    try {
      await postSalesPlanPayload(row.payload);
      await markDelivered(supabase, row);
      result.delivered += 1;
    } catch (error) {
      await markRetryFailed(supabase, row, error);
      result.failed += 1;
    }
  }
  return result;
}

async function notifyDailyReportChange(supabase, action, report) {
  const payload = buildSalesPlanPayload(action, report);
  await retryPendingSalesPlanEvents(supabase, 2);
  try {
    await postSalesPlanPayload(payload);
    return { ok: true };
  } catch (error) {
    await savePendingEvent(supabase, payload, error);
    return { ok: false, error: errorCode(error) };
  }
}

module.exports = {
  buildSalesPlanPayload,
  hasSalesPlanConfig,
  notifyDailyReportChange,
  retryPendingSalesPlanEvents
};
