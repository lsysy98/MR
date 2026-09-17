const crypto = require('node:crypto');
const clean = value => String(value || '').replace(/^\uFEFF/, '').trim();
const normalize = value => clean(value).replace(/\s+/g, '').toLowerCase();

function directoryId(item) {
  return item.code ? `code-${normalize(item.code)}` : 'client-' + crypto.createHash('sha1').update(`${item.client}|${item.branch}`).digest('hex').slice(0, 24);
}

function analyzeCims(rows) {
  const header = rows.findIndex((row, index) => index < 21 && /사업장명|지점명/.test(normalize(row[10])));
  if (header < 0 || normalize(rows[header][8]) !== '영업사원명' || normalize(rows[header][11]) !== '거래상태') {
    throw new Error('CIMS 열 구성이 달라 정리하지 않았습니다. I열 영업사원명, K열 사업장명, L열 거래상태를 확인해주세요.');
  }
  const allowed = new Map();
  const excluded = new Map();
  for (let index = header + 1; index < rows.length; index++) {
    const row = rows[index];
    const item = { index, code: clean(row[0]), client: clean(row[1]), branch: clean(row[10]) };
    if (!item.client) continue;
    const reasons = [];
    if (!/지점$/.test(item.branch)) reasons.push('지점 외 사업장');
    if (normalize(item.client).includes('기공소')) reasons.push('기공소');
    if (normalize(row[11]) === '폐업') reasons.push('폐업');
    if (/^오스템(?:[（(]거래종료[）)])?$/.test(normalize(row[8]))) reasons.push('오스템 담당');
    const id = directoryId(item);
    if (reasons.length) excluded.set(id, { id, reasons });
    else if (!allowed.has(id)) allowed.set(id, item);
  }
  // A valid row for the same code wins over an obsolete duplicate.
  for (const id of allowed.keys()) excluded.delete(id);
  if (!allowed.size) throw new Error('유효한 CIMS 거래처가 없어 기존 목록을 유지했습니다.');
  return { allowed: [...allowed.values()], excluded: [...excluded.values()] };
}

module.exports = { analyzeCims, directoryId };
