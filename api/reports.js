const { supabase, readAll, cleanSupabaseUrl, json, readBody, errorResponse } = require('../lib/storage');
const { hasSalesPlanConfig, retryPendingSalesPlanEvents } = require('./sales-plan-integration');

function fromDb(row) {
  return {
    id: row.id, createdAt: Number(row.created_at), updatedAt: Number(row.updated_at),
    date: row.report_date, owner: row.owner, client: row.client,
    clientCode: row.client_code || '', branchName: row.branch_name || '',
    type: row.type, product: row.product, amount: Number(row.amount),
    collectionYear: row.collection_year, collectionMonth: row.collection_month,
    prescriptionDone: Boolean(row.prescription_done), successCase: row.success_case || ''
  };
}
function reportFields(item, partial) {
  const fields = {
    date: 'report_date', owner: 'owner', client: 'client', clientCode: 'client_code',
    branchName: 'branch_name', type: 'type', product: 'product', amount: 'amount',
    collectionYear: 'collection_year', collectionMonth: 'collection_month',
    prescriptionDone: 'prescription_done', successCase: 'success_case'
  };
  const row = { id: item.id };
  for (const [key, column] of Object.entries(fields)) {
    if (partial && !['prescriptionDone', 'successCase'].includes(key)) continue;
    if (Object.prototype.hasOwnProperty.call(item, key)) row[column] = item[key];
  }
  if ('amount' in row && (!Number.isSafeInteger(row.amount) || row.amount < 0)) throw new Error('invalid_request');
  if ('client_code' in row && typeof row.client_code !== 'string') throw new Error('invalid_request');
  return row;
}

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.searchParams.get('debug') === '1') {
      const base = cleanSupabaseUrl();
      return json(res, 200, {
        ok: true, hasSupabaseUrl: Boolean(base), hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasSalesPlanIntegrationUrl: Boolean(process.env.SALES_PLAN_INTEGRATION_URL),
        hasSalesPlanIntegrationApiKey: Boolean(process.env.SALES_PLAN_INTEGRATION_API_KEY),
        salesPlanIntegrationReady: hasSalesPlanConfig(), integrationDisabledInTest: false,
        supabaseUrlLooksRight: /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base)
      });
    }
    if (req.method === 'GET' && url.searchParams.get('retrySalesPlan') === '1') {
      if (!process.env.ADMIN_KEY || url.searchParams.get('key') !== process.env.ADMIN_KEY) return json(res, 401, { error: 'unauthorized' });
      return json(res, 200, { ok: true, result: await retryPendingSalesPlanEvents(supabase, 25) });
    }
    if (req.method === 'GET') {
      const rows = await readAll('reports');
      rows.sort((a, b) => Number(b.created_at) - Number(a.created_at) || a.id.localeCompare(b.id));
      return json(res, 200, rows.map(fromDb));
    }
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
    const item = req.method === 'DELETE' ? Object.fromEntries(url.searchParams) : await readBody(req);
    if (!item.operationId) throw new Error('client_update_required');
    if (!item.id) throw new Error('invalid_request');
    const action = req.method === 'POST' ? 'create' : req.method === 'DELETE' ? 'delete' : 'update';
    const expected = action === 'create' ? null : Number(item.expectedUpdatedAt);
    if (action !== 'create' && (!Number.isSafeInteger(expected) || expected < 0)) throw new Error('report_conflict');
    const result = await supabase('rpc/mutate_report_safe', {
      method: 'POST',
      body: JSON.stringify({
        p_action: action, p_report: reportFields(item, req.method === 'PATCH'),
        p_expected_updated_at: expected, p_operation_id: item.operationId,
        p_actor: item.actor || item.owner || ''
      })
    });
    // The SQL trigger queues the exact committed version, including deletes and retries.
    await retryPendingSalesPlanEvents(supabase, 3);
    return json(res, action === 'create' ? 201 : 200, action === 'delete' ? { ok: true, count: 1 } : fromDb(result.row));
  } catch (error) { return errorResponse(res, error); }
};
