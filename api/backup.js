const { gzipSync } = require('node:zlib');
const { supabase, json, errorResponse } = require('../lib/storage');
module.exports = async function handler(req,res) {
  try {
    const url = new URL(req.url,'http://localhost');
    if (req.method !== 'GET') return json(res,405,{error:'Method not allowed'});
    if (!process.env.ADMIN_KEY || url.searchParams.get('key') !== process.env.ADMIN_KEY) return json(res,401,{error:'unauthorized'});
    const tables = await supabase('rpc/report_backup_snapshot',{method:'POST',body:'{}'});
    const data = {formatVersion:2,exportedAt:new Date().toISOString(),reports:tables.reports,logs:tables.report_logs,tables};
    const zip = gzipSync(Buffer.from(JSON.stringify(data)),{level:6});
    res.statusCode=200;
    res.setHeader('Content-Type','application/gzip');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Disposition','attachment; filename="daily-report-backup-'+new Date().toISOString().slice(0,10)+'.json.gz"');
    res.end(zip);
  } catch(error) { return errorResponse(res,error); }
};
