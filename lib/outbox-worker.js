const { randomUUID } = require('node:crypto');

// Only invoked by an explicitly enabled server worker. The test API never enables this worker.
async function drainOutbox({ db, url, apiKey, enabled = false, fetchImpl = fetch, limit = 10 }) {
  if (!enabled) return { ok: true, skipped: 'disabled_in_test', delivered: 0, failed: 0 };
  if (!url || !apiKey || !url.startsWith('https://')) throw new Error('Integration server configuration is missing.');
  const token = randomUUID();
  const rows = await db('rpc/claim_sales_plan_events', { method: 'POST', body: JSON.stringify({ p_token: token, p_limit: limit }) });
  const result = { delivered: 0, failed: 0, blocked: 0 };
  for (const row of rows) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let status = 'pending';
    let reason = '';
    try {
      const response = await fetchImpl(url, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(row.payload), redirect: 'error'
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok === true) status = 'delivered';
      else {
        reason = String(data?.error || `HTTP ${response.status}`);
        if ((response.status >= 400 && response.status < 500 && ![408,425,429].includes(response.status)) ||
            (response.ok && data?.ok === false && /invalid|unauthoriz|forbidden|required|unsupported/i.test(reason))) status = 'blocked';
      }
    } catch (error) { reason = error.name === 'AbortError' ? 'timeout' : 'network_error'; }
    finally { clearTimeout(timer); }
    const next = Date.now() + Math.min(3600000, 1000 * Math.pow(2, Math.min(row.attempt_count, 12)));
    const finished = await db('rpc/finish_sales_plan_event', {
      method: 'POST', body: JSON.stringify({ p_id: row.event_id, p_token: token, p_status: status, p_error: reason, p_next: next })
    });
    if (!finished) continue;
    if (status === 'delivered') result.delivered++;
    else if (status === 'blocked') result.blocked++;
    else result.failed++;
  }
  return result;
}
module.exports = { drainOutbox };
