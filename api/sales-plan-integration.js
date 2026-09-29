const { drainOutbox } = require('../lib/outbox-worker');

function hasSalesPlanConfig() {
  return Boolean(String(process.env.SALES_PLAN_INTEGRATION_URL || '').trim() &&
    String(process.env.SALES_PLAN_INTEGRATION_API_KEY || '').trim());
}

async function retryPendingSalesPlanEvents(supabase, limit = 3) {
  if (!hasSalesPlanConfig()) return { delivered: 0, failed: 0, skipped: 'missing_config' };
  try {
    return await drainOutbox({
      db: supabase,
      enabled: true,
      url: process.env.SALES_PLAN_INTEGRATION_URL.trim(),
      apiKey: process.env.SALES_PLAN_INTEGRATION_API_KEY.trim(),
      // Bound the synchronous work; remaining events stay queued for the next attempt.
      limit: Math.min(5, Math.max(1, Number(limit) || 3))
    });
  } catch (error) {
    console.warn('Sales plan delivery deferred; committed events remain in the outbox.');
    return { delivered: 0, failed: 0, skipped: 'delivery_deferred' };
  }
}

module.exports = { hasSalesPlanConfig, retryPendingSalesPlanEvents };
