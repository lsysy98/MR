const crypto = require('node:crypto');
const webpush = require('web-push');
const { supabase } = require('./storage');
const { koreaTime, isWorkingDay } = require('./report-calendar');
const owners = ['성진욱','김무영','이승엽','김태홍','제성규','송진영','이현욱'];
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

function config() {
  const missing = ['VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','PUSH_SITE_ORIGIN','CRON_SECRET'].filter(key => !process.env[key]);
  let origin = '';
  try {
    const url = new URL(process.env.PUSH_SITE_ORIGIN);
    if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) origin = url.origin;
  } catch (_) {}
  if (!origin && !missing.includes('PUSH_SITE_ORIGIN')) missing.push('PUSH_SITE_ORIGIN');
  if (!missing.length) {
    try { webpush.setVapidDetails(origin, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY); }
    catch (_) { missing.push('VAPID_KEYS_INVALID'); }
  }
  return { ready: process.env.PUSH_ENABLED === 'true' && missing.length === 0, origin, missing,
    publicKey: missing.length ? '' : process.env.VAPID_PUBLIC_KEY };
}

function validateSubscription(value) {
  if (!value || typeof value.endpoint !== 'string' || value.endpoint.length > 4096) throw new Error('invalid_subscription');
  let url;
  try { url = new URL(value.endpoint); } catch (_) { throw new Error('invalid_subscription'); }
  const host = url.hostname;
  const allowed = ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(host) || host.endsWith('.notify.windows.com');
  if (!allowed || url.protocol !== 'https:' || url.port || url.username || url.password || url.hash) throw new Error('invalid_subscription');
  const { p256dh, auth } = value.keys || {};
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !/^[\w-]+={0,2}$/.test(p256dh) || !/^[\w-]+={0,2}$/.test(auth)) throw new Error('invalid_subscription');
  const publicBytes = Buffer.from(p256dh, 'base64url');
  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || Buffer.from(auth, 'base64url').length !== 16) throw new Error('invalid_subscription');
  try { crypto.ECDH.convertKey(publicBytes, 'prime256v1'); } catch (_) { throw new Error('invalid_subscription'); }
  return { endpoint: value.endpoint, keys: { p256dh, auth } };
}

async function device(action, body) {
  if (!/^[a-zA-Z0-9_-]{43,128}$/.test(body.token || '')) throw new Error('invalid_device_token');
  const sub = action === 'subscribe' ? validateSubscription(body.subscription) : null;
  const id = sub ? hash(sub.endpoint) : body.id;
  if (!/^[0-9a-f]{64}$/.test(id || '')) throw new Error('invalid_device_token');
  if (['subscribe','preferences'].includes(action)) {
    if (!owners.includes(body.owner)) throw new Error('invalid_owner');
    if (body.reminderTime != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.reminderTime)) throw new Error('invalid_reminder_time');
    await supabase('rpc/configure_report_push_scheduler', { method: 'POST', body: JSON.stringify({ p_origin: config().origin, p_secret: process.env.CRON_SECRET }) });
  }
  const result = await supabase('rpc/report_push_device', { method: 'POST', body: JSON.stringify({
    p_action: action, p_id: id, p_token_hash: hash(body.token), p_owner: body.owner || '', p_subscription: sub || {}, p_reminder_time: body.reminderTime || null
  }) });
  return { id, enabled: Boolean(result?.enabled), owner: result?.owner || '', reminderTime: result?.reminderTime || '18:00' };
}

async function canRemind(date, owner) {
  const overrides = await supabase(`team_calendar_days?select=status&calendar_date=eq.${date}&limit=1`);
  if (!isWorkingDay(date, overrides[0])) return false;
  const rows = await supabase(`daily_completions?select=status&report_date=eq.${date}&owner=eq.${encodeURIComponent(owner)}&limit=1`);
  return !rows.some(row => ['done','leave'].includes(row.status));
}

async function deliver(sub, key, payload, shouldSend = async () => true, send = webpush.sendNotification.bind(webpush)) {
  const lease = crypto.randomUUID();
  const claimed = await supabase('rpc/claim_report_push', { method: 'POST', body: JSON.stringify({ p_id: sub.id, p_key: key, p_lease: lease }) });
  if (!claimed) return 'duplicate';
  let status = 'sent';
  let errorCode = null;
  try {
    const active = await supabase(`report_push_subscriptions?select=enabled,owner,reminder_time&id=eq.${sub.id}&limit=1`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && active[0]?.enabled && (active[0].reminder_time !== sub.reminder_time || active[0].owner !== sub.owner)) {
      await supabase(`report_push_deliveries?subscription_id=eq.${sub.id}&delivery_key=eq.${key}&lease=eq.${lease}`, { method: 'DELETE' });
      return 'rescheduled';
    }
    if (!active[0]?.enabled || active[0].owner !== sub.owner || !await shouldSend()) status = 'skipped';
    else {
      const subscription = validateSubscription(sub.subscription);
      await send(subscription, JSON.stringify(payload), { TTL: 3600, urgency: 'normal', timeout: 7000,
        vapidDetails: { subject: config().origin, publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY } });
    }
  } catch (error) {
    errorCode = error.statusCode ? `HTTP_${error.statusCode}` : (error.message === 'invalid_subscription' ? 'invalid_subscription' : 'network_or_storage_error');
    status = [404,410].includes(error.statusCode) || error.message === 'invalid_subscription' ? 'expired' : 'failed';
    if (status === 'expired') await supabase(`report_push_subscriptions?id=eq.${sub.id}`, { method: 'PATCH', body: '{"enabled":false}' });
  }
  // A pending log is intentionally not replayed after an uncertain process crash.
  await supabase(`report_push_deliveries?subscription_id=eq.${sub.id}&delivery_key=eq.${encodeURIComponent(key)}&lease=eq.${lease}`, {
    method: 'PATCH', body: JSON.stringify({ status, error_code: errorCode, updated_at: new Date().toISOString() })
  });
  return status;
}

async function sendTest(body) {
  const current = await device('status', body);
  if (!current.enabled) throw new Error('subscription_required');
  const rows = await supabase(`report_push_subscriptions?select=*&id=eq.${current.id}&limit=1`);
  const key = 'test-' + Math.floor(Date.now() / 60000);
  const result = await deliver(rows[0], key, {
    title: '일일보고 테스트 알림', body: `${current.owner}님, 이 기기의 알림이 연결되었습니다.`,
    tag: 'report-push-test', url: '/?report-reminder=1', expiresAt: Date.now() + 3600000
  });
  return { result };
}

async function dispatch({ now = new Date(), send } = {}) {
  if (!config().ready) return { skipped: 'not_configured' };
  const { date } = koreaTime(now);
  const overrides = await supabase(`team_calendar_days?select=status&calendar_date=eq.${date}&limit=1`);
  if (!isWorkingDay(date, overrides[0])) return { skipped: 'non_working_day' };
  const subscriptions = await supabase('rpc/report_push_due', { method: 'POST', body: JSON.stringify({ p_now: now.toISOString() }) });
  if (!subscriptions.length) return { date, skipped: 'no_due_subscriptions' };
  const results = {};
  let cursor = 0;
  async function worker() {
    while (cursor < subscriptions.length) {
      const sub = subscriptions[cursor++];
      const result = await deliver(sub, date, {
        title: '일일보고 미완료', body: `${sub.owner}님, 오늘 일일보고 완료 여부를 확인해주세요.`,
        tag: `daily-report-${date}`, url: '/?report-reminder=1',
        expiresAt: Math.min(now.getTime() + 3600000, new Date(date + 'T23:59:59+09:00').getTime())
      }, () => canRemind(date, sub.owner), send);
      results[result] = (results[result] || 0) + 1;
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, subscriptions.length) }, worker));
  return { date, ...results };
}

module.exports = { config, validateSubscription, device, sendTest, dispatch, deliver, owners };
