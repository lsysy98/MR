// Kept in parity with the report form's calendar; tests compare the two lists.
const holidays = new Set([
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-02','2026-05-05','2026-05-25',
  '2026-06-03','2026-07-17','2026-08-17','2026-09-24','2026-09-25','2026-09-28','2026-10-05','2026-10-09','2026-12-25',
  '2027-01-01','2027-02-08','2027-02-09','2027-03-01','2027-05-05','2027-05-13','2027-08-16',
  '2027-09-14','2027-09-15','2027-09-16','2027-10-04','2027-10-11','2027-12-27'
]);
function koreaTime(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600000);
  return { date: kst.toISOString().slice(0, 10), hour: kst.getUTCHours(), minute: kst.getUTCHours() * 60 + kst.getUTCMinutes() };
}
function isWorkingDay(date, override) {
  if (override?.status === 'workday') return true;
  if (override?.status === 'holiday') return false;
  if (!['2026','2027'].includes(date.slice(0, 4))) return false;
  const day = new Date(date + 'T00:00:00Z').getUTCDay();
  return day > 0 && day < 6 && !holidays.has(date);
}
module.exports = { holidays, koreaTime, isWorkingDay };
