function cleanSupabaseUrl() {
  return String(process.env.SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

async function supabase(path, options = {}) {
  const base = cleanSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base) || !key) throw new Error('Supabase 서버 설정을 확인해주세요.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}/rest/v1/${path}`, {
      ...options, signal: controller.signal,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers }
    });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : null; }
    catch (_) { throw new Error(`Supabase 일시 오류입니다. 다시 시도해주세요. (HTTP ${response.status})`); }
    if (!response.ok) {
      const error = new Error(data?.message || 'Supabase 요청 실패');
      error.code = data?.code;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('서버 응답이 늦습니다. 같은 내용으로 다시 저장해도 중복 등록되지 않습니다.');
    throw error;
  } finally { clearTimeout(timer); }
}

async function readAll(table, columns = '*', filters = '') {
  const rows = [];
  let cursor;
  for (;;) {
    const page = await supabase(`${table}?select=${columns}&order=id.asc&limit=1000${filters}${cursor === undefined ? '' : '&id=gt.' + encodeURIComponent(cursor)}`);
    if (!Array.isArray(page)) throw new Error('목록 응답 형식이 올바르지 않습니다.');
    if (!page.length) return rows;
    const last = page[page.length - 1].id;
    if (last == null || last === cursor) throw new Error('목록 페이지를 불러오지 못했습니다.');
    rows.push(...page);
    cursor = last;
  }
}

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1000000) throw new Error('invalid_request');
  }
  return JSON.parse(raw || '{}');
}

function errorResponse(res, error) {
  const messages = {
    client_update_required: [409, '사이트가 업데이트되었습니다. 새로고침한 뒤 다시 저장해주세요.'],
    report_conflict: [409, '다른 곳에서 수정된 보고입니다. 입력 내용은 유지됩니다. 최신 내용을 확인한 후 다시 수정해주세요.'],
    event_conflict: [409, '다른 곳에서 수정된 전시회입니다. 다시 열어 최신 내용을 확인해주세요.'],
    operation_conflict: [409, '이미 사용한 저장 요청입니다. 내용을 새로 확인해주세요.'],
    report_not_found: [404, '보고가 삭제되었거나 존재하지 않습니다.'],
    event_not_found: [404, '전시회가 삭제되었거나 존재하지 않습니다.'],
    invalid_request: [400, '입력한 내용을 확인해주세요.']
  };
  if (['PGRST202', '42883', '42P01', '42703'].includes(error.code)) {
    return json(res, 503, { error: '필요한 DB 설정을 먼저 적용해주세요.', code: 'upgrade_required' });
  }
  const known = messages[error.message];
  return json(res, known?.[0] || 500, { error: known?.[1] || error.message, code: known ? error.message : error.code });
}

module.exports = { supabase, readAll, cleanSupabaseUrl, json, readBody, errorResponse };
