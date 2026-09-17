const crypto = require('node:crypto');
const { json, readBody } = require('../lib/storage');
const push = require('../lib/report-push');

function matches(a, b) {
  return a && b && Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = async function handler(req, res) {
  try {
    const action = new URL(req.url, 'https://local.invalid').searchParams.get('action') || 'config';
    const settings = push.config();
    if (action === 'dispatch') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
      if (!matches(req.headers.authorization, process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '')) return json(res, 401, { error: 'Unauthorized' });
      return json(res, 200, { ok: true, ...await push.dispatch() });
    }
    if (req.method === 'GET' && action === 'config') {
      return json(res, 200, { ok: true, ready: settings.ready, publicKey: settings.publicKey,
        message: settings.ready ? '알림 연결 가능' : '원본 서버 알림 설정이 아직 완료되지 않았습니다.' });
    }
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
    if (!['subscribe','preferences','unsubscribe','status','test'].includes(action)) return json(res, 400, { error: '작업을 확인해주세요.' });
    if (req.headers.origin !== settings.origin || !settings.origin || req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: '원본 사이트에서 다시 실행해주세요.' });
    if (!settings.ready && ['subscribe','preferences','test'].includes(action)) return json(res, 503, { error: '원본 Vercel의 알림 환경변수를 먼저 설정해주세요.' });
    const body = await readBody(req);
    const result = action === 'test' ? await push.sendTest(body) : await push.device(action, body);
    return json(res, 200, { ok: true, ...result });
  } catch (error) {
    if (['PGRST202','42P01','42883','42703'].includes(error.code)) return json(res, 503, { error: '알림용 SQL을 원본 Supabase에 한 번 적용해주세요.' });
    const messages = {
      invalid_subscription: '브라우저 알림 정보를 확인하지 못했습니다.',
      invalid_device_token: '이 기기의 알림 연결을 다시 설정해주세요.',
      invalid_owner: '본인 이름을 선택해주세요.',
      invalid_reminder_time: '알림 시간을 시:분 형식으로 선택해주세요.',
      device_token_mismatch: '이전 기기 연결 정보가 없습니다. 알림 해제 후 다시 연결해주세요.',
      subscription_required: '알림을 먼저 허용해주세요.',
      device_limit: '등록된 기기가 너무 많습니다. 사용하지 않는 기기의 알림을 해제해주세요.'
    };
    return json(res, messages[error.message] ? 400 : 500, { error: messages[error.message] || '알림 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.' });
  }
};
