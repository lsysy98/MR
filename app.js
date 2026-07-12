var money = new Intl.NumberFormat("ko-KR");
var today = new Date();
var todayText = dateText(today);
var currentYear = today.getFullYear();
var currentMonth = today.getMonth() + 1;
var selectedYear = currentYear;
var selectedMonth = currentMonth;
var defaultCollection = nextCollectionMonth(today);
var collectionYear = defaultCollection.year;
var collectionMonth = defaultCollection.month;
var reports = [];
var dailyCompletions = [];
var completionLoadError = "";
var selectedType = "신규";
var selectedTeamPeriod = "day";
var selectedTeamDate = todayText;
var selectedWeekStart = dateText(startOfWeekDate(today));
var openedOwner = "";
var openedTeamOwner = "";
var ownerFilters = {};
var editingId = "";
var ownerNames = ["성진욱", "김무영", "이승엽", "김태홍", "제성규", "송진영", "이현욱"];

var form = document.getElementById("reportForm");
var ownerInput = document.getElementById("owner");
var dateInput = document.getElementById("date");
var clientInput = document.getElementById("client");
var branchInput = document.getElementById("branchName");
var productInput = document.getElementById("product");
var amountInput = document.getElementById("amount");
var amountPreview = document.getElementById("amountPreview");
var ownerCards = document.getElementById("ownerCards");
var todayOwnerCards = document.getElementById("todayOwnerCards");
var todayEmpty = document.getElementById("todayEmpty");
var statusBox = document.getElementById("statusBox");
var monthPicker = document.getElementById("monthPicker");
var collectionLabel = document.getElementById("collectionLabel");
var teamDayControl = document.getElementById("teamDayControl");
var teamDateLabel = document.getElementById("teamDateLabel");
var teamDatePicker = document.getElementById("teamDatePicker");
var teamWeekControl = document.getElementById("teamWeekControl");
var teamWeekLabel = document.getElementById("teamWeekLabel");
var teamWeekPicker = document.getElementById("teamWeekPicker");
var weeklyReportTools = document.getElementById("weeklyReportTools");
var weeklyReportStart = document.getElementById("weeklyReportStart");
var weeklyReportEnd = document.getElementById("weeklyReportEnd");
var copyWeeklyReportBtn = document.getElementById("copyWeeklyReportBtn");
var weeklyReportPanel = document.getElementById("weeklyReportPanel");
var weeklyReportRangeBox = document.getElementById("weeklyReportRange");
var weeklyDateToggleBtn = document.getElementById("weeklyDateToggleBtn");
var weeklyReportPreview = document.getElementById("weeklyReportPreview");
var confirmCopyWeeklyReportBtn = document.getElementById("confirmCopyWeeklyReportBtn");
var closeWeeklyReportBtn = document.getElementById("closeWeeklyReportBtn");
var completionPanel = document.getElementById("completionPanel");
var completionSummary = document.getElementById("completionSummary");
var completionCount = document.getElementById("completionCount");
var completionMissing = document.getElementById("completionMissing");
var completeDayBtn = document.getElementById("completeDayBtn");
var leaveDayBtn = document.getElementById("leaveDayBtn");
var dayScreenshotBtn = document.getElementById("dayScreenshotBtn");
var weekScreenshotBtn = document.getElementById("weekScreenshotBtn");
var leaveOverlay = document.getElementById("leaveOverlay");
var leaveTitle = document.getElementById("leaveTitle");
var leaveHelp = document.getElementById("leaveHelp");
var leaveStartDate = document.getElementById("leaveStartDate");
var leaveEndDate = document.getElementById("leaveEndDate");
var leaveList = document.getElementById("leaveList");
var leaveSaveBtn = document.getElementById("leaveSaveBtn");
var leaveCloseBtn = document.getElementById("leaveCloseBtn");
var calendarOverlay = document.getElementById("calendarOverlay");
var calendarTitle = document.getElementById("calendarTitle");
var calendarDays = document.getElementById("calendarDays");
var calendarPrevBtn = document.getElementById("calendarPrevBtn");
var calendarNextBtn = document.getElementById("calendarNextBtn");
var calendarTodayBtn = document.getElementById("calendarTodayBtn");
var calendarCloseBtn = document.getElementById("calendarCloseBtn");
var noticeOverlay = document.getElementById("noticeOverlay");
var noticeText = document.getElementById("noticeText");
var noticeOkBtn = document.getElementById("noticeOkBtn");
var noticeActions = document.getElementById("noticeActions");
var noticeActionBtn = document.getElementById("noticeActionBtn");
var noticeActionHandler = null;
var noticeLocked = false;
var noticeActionRequired = false;
var ownerLeaveRows = [];
var editingLeaveRangeDates = [];
var calendarMode = "day";
var calendarMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

setLeaveDateInput(dateInput, todayText);
if (teamDatePicker) teamDatePicker.value = selectedTeamDate;
if (teamWeekPicker) teamWeekPicker.value = selectedWeekStart;
var savedOwnerName = localStorage.getItem("ownerName") || "";
ownerInput.value = ownerNames.indexOf(savedOwnerName) >= 0 ? savedOwnerName : "";
productInput.value = "클로르";
var koreaHolidays = {
  "2026-01-01": true,
  "2026-02-16": true,
  "2026-02-17": true,
  "2026-02-18": true,
  "2026-03-02": true,
  "2026-05-05": true,
  "2026-05-25": true,
  "2026-06-03": true,
  "2026-08-17": true,
  "2026-09-24": true,
  "2026-09-25": true,
  "2026-09-28": true,
  "2026-10-05": true,
  "2026-10-09": true,
  "2026-12-25": true,
  "2027-01-01": true,
  "2027-02-08": true,
  "2027-02-09": true,
  "2027-03-01": true,
  "2027-05-05": true,
  "2027-05-13": true,
  "2027-08-16": true,
  "2027-09-14": true,
  "2027-09-15": true,
  "2027-09-16": true,
  "2027-10-04": true,
  "2027-10-11": true,
  "2027-12-27": true
};

function dateText(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}
function parseDateText(value) {
  var parts = String(value || todayText).split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
function addDays(d, days) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}
function startOfWeekDate(d) {
  var dayOffset = (d.getDay() + 6) % 7;
  return addDays(d, -dayOffset);
}
function weekLabelFromStart(startText) {
  var base = addDays(parseDateText(startText), 3);
  var first = new Date(base.getFullYear(), base.getMonth(), 1);
  var firstOffset = (first.getDay() + 6) % 7;
  var weekNo = Math.ceil((base.getDate() + firstOffset) / 7);
  return (base.getMonth() + 1) + "월 " + weekNo + "주차";
}
function weekMonthInfo(startText) {
  var base = addDays(parseDateText(startText || selectedWeekStart), 3);
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
}
function clampDateToMonth(value, info) {
  var date = parseDateText(value);
  var first = new Date(info.year, info.month - 1, 1);
  var last = new Date(info.year, info.month, 0);
  if (date < first) date = first;
  if (date > last) date = last;
  return dateText(date);
}
function weekNumberOfDate(value) {
  var d = parseDateText(value);
  var first = new Date(d.getFullYear(), d.getMonth(), 1);
  var firstOffset = (first.getDay() + 6) % 7;
  return Math.ceil((d.getDate() + firstOffset) / 7);
}
function dayLabel(value) {
  var d = parseDateText(value);
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  return d.getFullYear() + ". " +
    String(d.getMonth() + 1).padStart(2, "0") + ". " +
    String(d.getDate()).padStart(2, "0") + ". " +
    days[d.getDay()];
}
function isFridayDate(value) {
  return parseDateText(value).getDay() === 5;
}
function isWeekdayDate(d) {
  var day = d.getDay();
  return day >= 1 && day <= 5;
}
function isWeekendDateText(value) {
  return !isWeekdayDate(parseDateText(value));
}
function weekendBlockMessage() {
  return calendarMode === "formDate"
    ? "주말에는 거래처 입력이 불가능합니다. 다른 날짜를 선택해주세요."
    : "주말에는 일일현황을 조회할 수 없습니다. 다른 날짜를 선택해주세요.";
}
function nextWeekdayText(value, delta) {
  var cursor = parseDateText(value);
  do {
    cursor = addDays(cursor, delta);
  } while (!isWeekdayDate(cursor));
  return dateText(cursor);
}
function isKoreanHolidayDateText(value) {
  return Boolean(koreaHolidays[value]);
}
function remainingWeekdaysAfter(value) {
  var d = parseDateText(value);
  var days = [];
  for (var cursor = addDays(d, 1); cursor.getDay() !== 1; cursor = addDays(cursor, 1)) {
    if (isWeekdayDate(cursor)) days.push(dateText(cursor));
  }
  return days;
}
function shouldCaptureWeeklyForDate(value) {
  if (isFridayDate(value)) return true;
  var rest = remainingWeekdaysAfter(value);
  return rest.length > 0 && rest.every(isKoreanHolidayDateText);
}
function weeklyCaptureMessage(value) {
  if (isFridayDate(value)) return "금요일이니 주간 보고를 캡쳐합니다.";
  return "이번 주 남은 평일이 휴일이므로 주간 보고를 캡쳐합니다.";
}
function downloadResolvedScreenshot() {
  var isWeekly = shouldCaptureWeeklyForDate(selectedTeamDate);
  var message = "스크린샷을 저장합니다.";
  if (isWeekly) message += " " + weeklyCaptureMessage(selectedTeamDate);
  showNotice(message, "", "저장", function() {
    hideNotice();
    if (isWeekly) {
      downloadWeekScreenshot();
    } else {
      downloadDayScreenshot();
    }
  });
}
function showAllResolvedNotice() {
  if (shouldCaptureWeeklyForDate(selectedTeamDate)) {
    showNotice("모든 담당자의 일일보고가 완료되었습니다. " + weeklyCaptureMessage(selectedTeamDate), "", "주간 캡쳐 저장", function() {
      downloadWeekScreenshot();
      hideNotice();
    }, true, true);
  } else {
    showNotice("모든 담당자의 일일보고가 완료되었습니다. 스크린샷을 저장해야 넘어갈 수 있습니다.", "", "스크린샷 저장", function() {
      downloadDayScreenshot();
      hideNotice();
    }, true, true);
  }
}
function nextCollectionMonth(d) {
  var year = d.getFullYear();
  var month = d.getMonth() + 2;
  if (month > 12) {
    year += 1;
    month = 1;
  }
  return { year: year, month: month };
}
function monthValue() {
  return selectedYear + "-" + String(selectedMonth).padStart(2, "0");
}
function makeId() {
  return Date.now() + "-" + Math.random().toString(16).slice(2);
}
function digits(v) {
  return String(v || "").replace(/[^\d]/g, "");
}
function amountMan(v) {
  return Number(digits(v) || 0);
}
function amountWon(v) {
  return amountMan(v) * 10000;
}
function won(v) {
  var n = Number(v || 0);
  return n ? money.format(n) + "원" : "0원";
}
function wonMan(v) {
  var n = Number(v || 0);
  return n ? money.format(Math.round(n / 10000)) + "만원" : "0원";
}
function yearOf(x) {
  return x.date ? Number(String(x.date).slice(0, 4)) : currentYear;
}
function monthOf(x) {
  return x.date ? Number(String(x.date).slice(5, 7)) : currentMonth;
}
function collectionYearOf(item) {
  return Number(item.collectionYear || yearOf(item));
}
function collectionMonthOf(item) {
  return Number(item.collectionMonth || monthOf(item));
}
function collectionText(item) {
  return collectionYearOf(item) + "년 " + collectionMonthOf(item) + "월";
}
function normalizeClientName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}
function findDuplicateReport(item) {
  var clientName = normalizeClientName(item.client);
  return reports.find(function(report) {
    return report.id !== item.id &&
      report.owner === item.owner &&
      report.type === item.type &&
      normalizeClientName(report.client) === clientName;
  });
}
function typeClass(type) {
  return type === "신규" ? "new" : "growth";
}
function status(message, type) {
  if (!statusBox) return;
  statusBox.style.display = message ? "block" : "none";
  statusBox.textContent = message;
  statusBox.className = "status " + (type || "");
}
window.addEventListener("error", function(event) {
  status("화면 오류: " + (event.message || "알 수 없는 오류"), "error");
});
window.addEventListener("unhandledrejection", function(event) {
  var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason || "알 수 없는 오류");
  status("화면 오류: " + reason, "error");
});
function toast(msg) {
  var box = document.getElementById("toast");
  box.textContent = msg;
  setTimeout(function() { box.textContent = ""; }, 2200);
}
function hideNotice() {
  if (!noticeOverlay) return;
  noticeOverlay.classList.remove("active");
  noticeOverlay.classList.remove("danger");
  noticeOverlay.setAttribute("aria-hidden", "true");
  noticeActionHandler = null;
  noticeLocked = false;
  noticeActionRequired = false;
  if (noticeActionBtn) noticeActionBtn.style.display = "none";
  if (noticeActionBtn) noticeActionBtn.classList.remove("primary");
  if (noticeOkBtn) {
    noticeOkBtn.style.display = "block";
    noticeOkBtn.textContent = "확인";
    noticeOkBtn.classList.add("primary");
  }
  if (noticeActions) {
    noticeActions.classList.remove("has-action");
    noticeActions.classList.remove("action-required");
  }
}
function showNotice(msg, type, actionLabel, actionHandler, lockOutside, requireAction) {
  if (!noticeOverlay || !noticeText) {
    toast(msg);
    return;
  }
  noticeOverlay.classList.toggle("danger", type === "danger");
  noticeActionHandler = typeof actionHandler === "function" ? actionHandler : null;
  noticeLocked = Boolean(lockOutside);
  noticeActionRequired = Boolean(requireAction);
  if (noticeActionBtn) {
    noticeActionBtn.textContent = actionLabel || "";
    noticeActionBtn.style.display = noticeActionHandler ? "block" : "none";
    noticeActionBtn.classList.toggle("primary", Boolean(noticeActionHandler));
  }
  if (noticeOkBtn) {
    noticeOkBtn.style.display = noticeActionRequired ? "none" : "block";
    noticeOkBtn.textContent = noticeActionHandler ? "취소" : "확인";
    noticeOkBtn.classList.toggle("primary", !noticeActionHandler);
  }
  if (noticeActions) {
    noticeActions.classList.toggle("has-action", Boolean(noticeActionHandler));
    noticeActions.classList.toggle("action-required", noticeActionRequired);
  }
  noticeText.textContent = msg;
  noticeOverlay.classList.add("active");
  noticeOverlay.setAttribute("aria-hidden", "false");
}
function openDatePicker(input) {
  if (!input) return;
  if (typeof input.showPicker === "function") {
    input.showPicker();
  } else {
    input.focus();
    input.click();
  }
}
function closeCalendar() {
  if (!calendarOverlay) return;
  calendarOverlay.classList.remove("active");
  calendarOverlay.setAttribute("aria-hidden", "true");
}
function openCalendar(mode, value) {
  calendarMode = mode;
  var base = parseDateText(value || todayText);
  calendarMonthDate = new Date(base.getFullYear(), base.getMonth(), 1);
  renderCalendar();
  if (calendarOverlay) {
    calendarOverlay.classList.add("active");
    calendarOverlay.setAttribute("aria-hidden", "false");
  }
}
function selectedCalendarDateText() {
  if (calendarMode === "formDate") return leaveDateValue(dateInput) || todayText;
  if (calendarMode === "leaveStart") return leaveDateValue(leaveStartDate) || selectedTeamDate;
  if (calendarMode === "leaveEnd") return leaveDateValue(leaveEndDate) || selectedTeamDate;
  if (calendarMode === "weeklyStart") return leaveDateValue(weeklyReportStart) || selectedTeamDate;
  if (calendarMode === "weeklyEnd") return leaveDateValue(weeklyReportEnd) || selectedTeamDate;
  return calendarMode === "week" ? selectedWeekStart : selectedTeamDate;
}
function applyCalendarDate(selectedKey) {
  if (["formDate", "day", "week", "weeklyStart", "weeklyEnd"].indexOf(calendarMode) >= 0 && isWeekendDateText(selectedKey)) {
    showNotice(weekendBlockMessage(), "danger");
    return;
  }
  if (calendarMode === "formDate") {
    setLeaveDateInput(dateInput, selectedKey);
    closeCalendar();
  } else if (calendarMode === "leaveStart") {
    setLeaveDateInput(leaveStartDate, selectedKey);
    if (leaveEndDate && (!leaveDateValue(leaveEndDate) || leaveDateValue(leaveEndDate) < selectedKey)) {
      setLeaveDateInput(leaveEndDate, selectedKey);
    }
    closeCalendar();
  } else if (calendarMode === "leaveEnd") {
    setLeaveDateInput(leaveEndDate, selectedKey);
    if (leaveStartDate && leaveDateValue(leaveStartDate) && selectedKey < leaveDateValue(leaveStartDate)) {
      setLeaveDateInput(leaveStartDate, selectedKey);
    }
    closeCalendar();
  } else if (calendarMode === "weeklyStart") {
    setLeaveDateInput(weeklyReportStart, selectedKey);
    if (weeklyReportEnd && (!leaveDateValue(weeklyReportEnd) || leaveDateValue(weeklyReportEnd) < selectedKey)) {
      setLeaveDateInput(weeklyReportEnd, selectedKey);
    }
    updateWeeklyReportPreview();
    closeCalendar();
  } else if (calendarMode === "weeklyEnd") {
    setLeaveDateInput(weeklyReportEnd, selectedKey);
    if (weeklyReportStart && leaveDateValue(weeklyReportStart) && selectedKey < leaveDateValue(weeklyReportStart)) {
      setLeaveDateInput(weeklyReportStart, selectedKey);
    }
    updateWeeklyReportPreview();
    closeCalendar();
  } else if (calendarMode === "week") {
    selectedWeekStart = dateText(startOfWeekDate(parseDateText(selectedKey)));
    if (teamWeekPicker) teamWeekPicker.value = selectedWeekStart;
    setDefaultWeeklyReportRange();
    openedTeamOwner = "";
    closeCalendar();
    render();
  } else {
    selectedTeamDate = selectedKey;
    if (teamDatePicker) teamDatePicker.value = selectedTeamDate;
    openedTeamOwner = "";
    closeCalendar();
    loadCompletionsForSelectedDate();
  }
}
function renderCalendar() {
  if (!calendarDays || !calendarTitle) return;
  var year = calendarMonthDate.getFullYear();
  var month = calendarMonthDate.getMonth();
  calendarTitle.textContent = year + "년 " + (month + 1) + "월";
  calendarDays.textContent = "";

  var first = new Date(year, month, 1);
  var lastDay = new Date(year, month + 1, 0).getDate();
  for (var blank = 0; blank < first.getDay(); blank += 1) {
    var empty = document.createElement("button");
    empty.type = "button";
    empty.className = "calendar-day blank";
    empty.disabled = true;
    calendarDays.appendChild(empty);
  }
  for (var day = 1; day <= lastDay; day += 1) {
    var d = new Date(year, month, day);
    var key = dateText(d);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "calendar-day";
    btn.textContent = String(day);
    if (!isWeekdayDate(d)) btn.classList.add("weekend");
    if (isKoreanHolidayDateText(key)) btn.classList.add("holiday");
    if (key === todayText) btn.classList.add("today");
    if (key === selectedCalendarDateText()) btn.classList.add("selected");
    btn.addEventListener("click", function(selectedKey) {
      return function() {
        applyCalendarDate(selectedKey);
      };
    }(key));
    calendarDays.appendChild(btn);
  }
}
function updateAmountPreview() {
  var man = amountMan(amountInput.value);
  amountPreview.textContent = man ? money.format(man) + "만원" : "1 입력 = 1만원";
}
function updateTypeButtons() {
  document.querySelectorAll("[data-type]").forEach(function(button) {
    button.classList.toggle("active", button.dataset.type === selectedType);
  });
}
function syncMonthPicker() {
  if (monthPicker) monthPicker.value = monthValue();
}
function syncCollectionButtons() {
  if (collectionLabel) {
    collectionLabel.textContent = collectionYear + "." + String(collectionMonth).padStart(2, "0");
  }
}
function syncTeamPeriodControls() {
  if (teamDayControl) {
    teamDayControl.style.display = selectedTeamPeriod === "day" ? "grid" : "none";
  }
  if (teamDateLabel) {
    teamDateLabel.textContent = dayLabel(selectedTeamDate);
  }
  if (teamDatePicker) {
    teamDatePicker.value = selectedTeamDate;
  }
  if (teamWeekControl) {
    teamWeekControl.style.display = selectedTeamPeriod === "week" ? "grid" : "none";
  }
  if (teamWeekLabel) {
    teamWeekLabel.textContent = weekLabelFromStart(selectedWeekStart);
  }
  if (teamWeekPicker) {
    teamWeekPicker.value = selectedWeekStart;
  }
  if (weeklyReportTools) {
    weeklyReportTools.style.display = selectedTeamPeriod === "week" ? "grid" : "none";
  }
  if (selectedTeamPeriod !== "week") {
    closeWeeklyReportPanel();
  }
}
function moveCollectionMonth(delta) {
  var d = new Date(collectionYear, collectionMonth - 1 + delta, 1);
  collectionYear = d.getFullYear();
  collectionMonth = d.getMonth() + 1;
  syncCollectionButtons();
}
function setDefaultCollectionMonth() {
  var next = nextCollectionMonth(new Date());
  collectionYear = next.year;
  collectionMonth = next.month;
  syncCollectionButtons();
}
function moveMonth(delta) {
  var d = new Date(selectedYear, selectedMonth - 1 + delta, 1);
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth() + 1;
  syncMonthPicker();
  render();
}
function resetToCurrentMonth() {
  selectedYear = currentYear;
  selectedMonth = currentMonth;
  syncMonthPicker();
  render();
}

async function requestJson(url, options, timeoutMs) {
  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timer = controller ? setTimeout(function() { controller.abort(); }, timeoutMs || 12000) : null;
  if (controller) options.signal = controller.signal;
  try {
    var response = await fetch(url, options);
    var data = await response.json().catch(function() { return {}; });
    if (!response.ok) throw new Error(data.error || "요청 실패");
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("서버 응답이 너무 늦습니다. Vercel 환경변수 또는 Supabase 연결을 확인해주세요.");
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function api(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  return requestJson("/api/reports" + (query || ""), options, 12000);
}
async function completionApi(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  return requestJson("/api/completions" + (query || ""), options, 8000);
}
async function loadCompletionsForSelectedDate(skipRender) {
  try {
    dailyCompletions = await completionApi("GET", null, "?date=" + encodeURIComponent(selectedTeamDate));
    completionLoadError = "";
  } catch (error) {
    dailyCompletions = [];
    completionLoadError = error.message;
  }
  if (!skipRender) render();
}
async function loadData() {
  status("보고 데이터를 불러오는 중입니다.", "");
  reports = await api("GET");
  status("", "");
  render();
  loadCompletionsForSelectedDate();
}
async function addData(item, skipNotice) {
  var saved = await api("POST", item);
  reports.unshift(saved);
  render();
  if (!skipNotice) showNotice("저장되었습니다.");
}
async function updateData(item) {
  var actor = ownerInput.value.trim() || localStorage.getItem("ownerName") || item.owner || "";
  var saved = await api("PUT", Object.assign({}, item, { actor: actor }));
  reports = reports.map(function(report) {
    return report.id === saved.id ? saved : report;
  });
  render();
  showNotice("수정되었습니다.");
}
async function deleteData(id) {
  var item = reports.find(function(report) { return report.id === id; });
  if (!item) return;
  var typed = prompt("삭제하려면 거래처명을 정확히 입력해주세요.\n\n거래처명: " + item.client);
  if (typed === null) return;
  if (typed.trim() !== item.client) {
    showNotice("거래처명이 정확하지 않아 삭제되지 않았습니다.", "danger");
    return;
  }
  var actor = ownerInput.value.trim() || localStorage.getItem("ownerName") || item.owner || "";
  await api("DELETE", null, "?id=" + encodeURIComponent(id) + "&actor=" + encodeURIComponent(actor));
  reports = reports.filter(function(report) {
    return report.id !== id;
  });
  render();
  showNotice("삭제되었습니다.");
}
function askCompleteAfterSave(owner, reportDate) {
  var targetDate = reportDate || todayText;
  var message = targetDate === todayText
    ? "저장되었습니다. 오늘 보고 완료하시겠습니까?"
    : "저장되었습니다. 이 날짜의 보고를 완료하시겠습니까?";
  showNotice(message, "", "완료", function() {
    hideNotice();
    setDailyCompleteFor(owner, targetDate, true).catch(function(error) {
      showNotice("완료 처리 실패: " + error.message, "danger");
    });
  });
}
async function togglePrescription(item) {
  var next = Object.assign({}, item, {
    prescriptionDone: !item.prescriptionDone,
    updatedAt: Date.now()
  });
  await updateData(next);
}

function summarize(items) {
  var result = {
    total: { count: 0, amount: 0 },
    new: { count: 0, amount: 0 },
    growth: { count: 0, amount: 0 },
    done: 0
  };
  items.forEach(function(item) {
    var amount = Number(item.amount || 0);
    result.total.count += 1;
    result.total.amount += amount;
    if (item.type === "신규") {
      result.new.count += 1;
      result.new.amount += amount;
    } else {
      result.growth.count += 1;
      result.growth.amount += amount;
    }
    if (item.prescriptionDone) result.done += 1;
  });
  return result;
}
function monthlyItems() {
  return reports.filter(function(item) {
    return collectionYearOf(item) === selectedYear &&
      collectionMonthOf(item) === selectedMonth &&
      ownerNames.indexOf(item.owner) >= 0;
  });
}
function weekRange() {
  var start = parseDateText(selectedWeekStart);
  var end = addDays(start, 4);
  return { start: dateText(start), end: dateText(end) };
}
function monthBoundedWeekRange() {
  var range = weekRange();
  var info = weekMonthInfo(selectedWeekStart);
  return {
    start: clampDateToMonth(range.start, info),
    end: clampDateToMonth(range.end, info),
    year: info.year,
    month: info.month
  };
}
function defaultWeeklyReportRange() {
  var range = weekRange();
  var info = weekMonthInfo(selectedWeekStart);
  return {
    start: range.start,
    end: range.end,
    year: info.year,
    month: info.month
  };
}
function setDefaultWeeklyReportRange() {
  if (!weeklyReportStart || !weeklyReportEnd) return;
  var range = defaultWeeklyReportRange();
  setLeaveDateInput(weeklyReportStart, range.start);
  setLeaveDateInput(weeklyReportEnd, range.end);
  updateWeeklyReportPreview();
}
function weeklyReportRange() {
  var defaults = defaultWeeklyReportRange();
  var start = leaveDateValue(weeklyReportStart) || defaults.start;
  var end = leaveDateValue(weeklyReportEnd) || defaults.end;
  if (end < start) {
    var temp = start;
    start = end;
    end = temp;
  }
  return { start: start, end: end, year: defaults.year, month: defaults.month };
}
function teamPeriodItems() {
  var range = monthBoundedWeekRange();
  return reports.filter(function(item) {
    if (ownerNames.indexOf(item.owner) < 0) return false;
    if (selectedTeamPeriod === "week") {
      return item.date >= range.start &&
        item.date <= range.end &&
        isWeekdayDate(parseDateText(item.date));
    }
    return item.date === selectedTeamDate;
  });
}
function dateRangeItems(range) {
  return reports.filter(function(item) {
    return ownerNames.indexOf(item.owner) >= 0 &&
      item.date >= range.start &&
      item.date <= range.end &&
      isWeekdayDate(parseDateText(item.date));
  });
}
function koreanMonthDay(value, includeMonth) {
  var d = parseDateText(value);
  return (includeMonth ? (d.getMonth() + 1) + "월 " : "") + d.getDate() + "일";
}
function weekNumbersText(start, end) {
  var numbers = [];
  for (var cursor = parseDateText(start); cursor <= parseDateText(end); cursor = addDays(cursor, 1)) {
    var number = weekNumberOfDate(dateText(cursor));
    if (numbers.indexOf(number) < 0) numbers.push(number);
  }
  return numbers.join(", ") + "주차";
}
function percentText(amount, target) {
  var value = target ? Number(amount || 0) / target * 100 : 0;
  var rounded = Math.round(value * 10) / 10;
  return (Math.abs(rounded - Math.round(rounded)) < 0.05 ? String(Math.round(rounded)) : rounded.toFixed(1)) + "%";
}
function reportWonMan(value) {
  return money.format(Math.round(Number(value || 0) / 10000)) + "만원";
}
function weeklyReportText() {
  var range = weeklyReportRange();
  var items = dateRangeItems(range);
  var summary = summarize(items);
  var targetAmount = ownerCount() * 2000000;
  var startDate = parseDateText(range.start);
  var endDate = parseDateText(range.end);
  var endIncludesMonth = startDate.getFullYear() !== endDate.getFullYear() || startDate.getMonth() !== endDate.getMonth();
  var ownerLines = groupByOwner(items)
    .sort(function(a, b) {
      var amountDiff = b.summary.total.amount - a.summary.total.amount;
      if (amountDiff !== 0) return amountDiff;
      return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
    })
    .map(function(group) {
      return group.owner + " " + reportWonMan(group.summary.total.amount) + " / " +
        percentText(group.summary.total.amount, 2000000) + "\n" +
        "(신규 " + group.summary.new.count + " / 증대 " + group.summary.growth.count + ")";
    });

  return [
    "< 수도권팀 주간보고 >",
    "*" + koreanMonthDay(range.start, true) + " ~ " + koreanMonthDay(range.end, endIncludesMonth) + " (" + weekNumbersText(range.start, range.end) + ")",
    "",
    "---------------------------",
    "MR 수도권팀",
    "",
    "주간 누적 신규 " + summary.new.count + "건 / 증대 " + summary.growth.count + "건",
    "누적 매출합 " + reportWonMan(summary.total.amount),
    "",
    "---------------------------",
    String(range.month).padStart(2, "0") + "월 누적 매출",
    "",
    "팀 목표 : " + reportWonMan(targetAmount),
    "누적매출 : " + reportWonMan(summary.total.amount) + " / " + percentText(summary.total.amount, targetAmount),
    "",
    "담당자별 실적",
    ownerLines.join("\n\n")
  ].join("\n");
}
function updateWeeklyReportPreview() {
  if (!weeklyReportPreview) return;
  weeklyReportPreview.textContent = weeklyReportText();
}
function openWeeklyReportPanel() {
  if (!weeklyReportPanel) return;
  if (!weeklyReportPanel.classList.contains("active")) {
    setDefaultWeeklyReportRange();
    if (weeklyReportRangeBox) weeklyReportRangeBox.classList.remove("active");
    if (weeklyDateToggleBtn) weeklyDateToggleBtn.textContent = "날짜 설정";
  }
  weeklyReportPanel.classList.add("active");
  weeklyReportPanel.setAttribute("aria-hidden", "false");
  updateWeeklyReportPreview();
}
function closeWeeklyReportPanel() {
  if (weeklyReportPanel) weeklyReportPanel.classList.remove("active");
  if (weeklyReportPanel) weeklyReportPanel.setAttribute("aria-hidden", "true");
  if (weeklyReportRangeBox) weeklyReportRangeBox.classList.remove("active");
  if (weeklyDateToggleBtn) weeklyDateToggleBtn.textContent = "날짜 설정";
}
function toggleWeeklyDateSettings() {
  if (!weeklyReportRangeBox) return;
  var open = !weeklyReportRangeBox.classList.contains("active");
  weeklyReportRangeBox.classList.toggle("active", open);
  if (weeklyDateToggleBtn) weeklyDateToggleBtn.textContent = open ? "날짜 설정 닫기" : "날짜 설정";
}
async function copyWeeklyReportText() {
  var text = weeklyReportText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  showNotice("카톡 보고 문구를 복사했습니다.");
}
function completedOwnerSet() {
  var map = {};
  dailyCompletions.forEach(function(item) {
    if (item.date === selectedTeamDate && ownerNames.indexOf(item.owner) >= 0 && (item.status || "done") === "done") {
      map[item.owner] = true;
    }
  });
  return map;
}
function dailyStatusMap() {
  var map = {};
  dailyCompletions.forEach(function(item) {
    if (item.date === selectedTeamDate && ownerNames.indexOf(item.owner) >= 0) {
      map[item.owner] = item.status === "leave" ? "leave" : "done";
    }
  });
  return map;
}
function ownerDailyStatus(owner) {
  return dailyStatusMap()[owner] || "missing";
}
function dailyStatusLabel(status) {
  if (status === "done") return "완료";
  if (status === "leave") return "연차";
  return "미완료";
}
function completionStats() {
  var statusMap = dailyStatusMap();
  var done = ownerNames.filter(function(owner) { return statusMap[owner] === "done"; });
  var leave = ownerNames.filter(function(owner) { return statusMap[owner] === "leave"; });
  var missing = ownerNames.filter(function(owner) { return !statusMap[owner]; });
  var resolved = ownerNames.filter(function(owner) { return Boolean(statusMap[owner]); });
  return {
    statusMap: statusMap,
    doneMap: completedOwnerSet(),
    done: done,
    leave: leave,
    missing: missing,
    resolved: resolved,
    allResolved: resolved.length === ownerNames.length
  };
}
function renderCompletionPanel() {
  if (!completionPanel) return;

  var isDay = selectedTeamPeriod === "day";
  completionPanel.style.display = isDay ? "grid" : "none";
  completionPanel.classList.toggle("week-only", !isDay);
  if (completionSummary) completionSummary.style.display = "none";
  if (completeDayBtn) completeDayBtn.style.display = isDay ? "inline-flex" : "none";
  if (leaveDayBtn) leaveDayBtn.style.display = isDay ? "inline-flex" : "none";
  if (dayScreenshotBtn) dayScreenshotBtn.style.display = "none";
  if (weekScreenshotBtn) weekScreenshotBtn.style.display = "none";

  if (!isDay) {
    if (completionCount) completionCount.textContent = "주간현황";
    if (completionMissing) completionMissing.textContent = weekLabelFromStart(selectedWeekStart) + " 스크린샷을 저장할 수 있습니다.";
    return;
  }

  if (completionLoadError) {
    if (completionCount) completionCount.textContent = "완료 상태 연결 실패";
    if (completionMissing) completionMissing.textContent = completionLoadError;
    if (completeDayBtn) {
      completeDayBtn.disabled = false;
      completeDayBtn.textContent = "내 보고 완료";
      completeDayBtn.classList.remove("primary");
    }
    if (leaveDayBtn) {
      leaveDayBtn.disabled = false;
      leaveDayBtn.textContent = "연차 설정";
    }
  }

  var stats = completionStats();
  if (completionCount) completionCount.textContent = "완료 " + stats.done.length + "/" + ownerNames.length;
  if (completionMissing) completionMissing.textContent = "";
  if (dayScreenshotBtn) {
    dayScreenshotBtn.textContent = shouldCaptureWeeklyForDate(selectedTeamDate) ? "주간 캡쳐 저장" : "스크린샷 저장";
  }
  if (completeDayBtn) {
    var owner = ownerInput.value.trim() || localStorage.getItem("ownerName") || "";
    var status = stats.statusMap[owner] || "missing";
    var alreadyDone = status === "done";
    completeDayBtn.disabled = false;
    completeDayBtn.textContent = alreadyDone ? "완료됨" : "내 보고 완료";
    completeDayBtn.classList.toggle("primary", alreadyDone);
  }
  if (leaveDayBtn) {
    leaveDayBtn.disabled = false;
    leaveDayBtn.textContent = "연차 설정";
  }
}
function currentOwnerName() {
  var owner = ownerInput.value.trim() || localStorage.getItem("ownerName") || "";
  return ownerNames.indexOf(owner) >= 0 ? owner : "";
}
async function setDailyCompleteFor(owner, targetDate, showDoneNotice) {
  if (!owner || ownerNames.indexOf(owner) < 0) {
    showNotice("담당자 이름을 먼저 선택해주세요.", "danger");
    return;
  }

  var previousDate = selectedTeamDate;
  if (targetDate && targetDate !== selectedTeamDate) {
    selectedTeamDate = targetDate;
    if (teamDatePicker) teamDatePicker.value = selectedTeamDate;
    await loadCompletionsForSelectedDate(true);
  }

  var beforeStats = completionStats();
  if (beforeStats.statusMap[owner] === "done") {
    if (showDoneNotice) showNotice("이미 완료 처리되어 있습니다.");
    if (previousDate !== selectedTeamDate) render();
    return;
  }

  var saved = await completionApi("POST", { date: selectedTeamDate, owner: owner, status: "done" });
  var found = false;
  dailyCompletions = dailyCompletions.map(function(item) {
    if (item.owner === saved.owner && item.date === saved.date) {
      found = true;
      return saved;
    }
    return item;
  });
  if (!found) dailyCompletions.push(saved);
  render();

  var afterStats = completionStats();
  if (!beforeStats.allResolved && afterStats.allResolved) {
    showAllResolvedNotice();
  } else if (showDoneNotice) {
    showNotice("완료 처리되었습니다.");
  }
}
async function markDailyComplete() {
  var owner = currentOwnerName();
  if (!owner) {
    showNotice("작성하기에서 담당자 이름을 먼저 선택해주세요.", "danger");
    return;
  }
  var beforeStats = completionStats();
  if (beforeStats.statusMap[owner] === "done") {
    await completionApi("DELETE", null, "?date=" + encodeURIComponent(selectedTeamDate) + "&owner=" + encodeURIComponent(owner));
    dailyCompletions = dailyCompletions.filter(function(item) {
      return !(item.owner === owner && item.date === selectedTeamDate);
    });
    render();
    showNotice("미완료로 변경되었습니다.");
    return;
  }
  await setDailyCompleteFor(owner, selectedTeamDate, true);
}
function datesBetween(startText, endText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startText) || !/^\d{4}-\d{2}-\d{2}$/.test(endText)) return [];
  var start = parseDateText(startText);
  var end = parseDateText(endText);
  if (dateText(start) !== startText || dateText(end) !== endText || end < start) return [];
  var dates = [];
  for (var cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(dateText(cursor));
  }
  return dates;
}
function koreanDateShort(value) {
  var d = parseDateText(value);
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  return (d.getMonth() + 1) + "/" + d.getDate() + "(" + days[d.getDay()] + ")";
}
function leaveRangeText(range) {
  if (range.start === range.end) return koreanDateShort(range.start);
  return koreanDateShort(range.start) + "~" + koreanDateShort(range.end);
}
function leaveDateInputText(value) {
  if (!value) return "";
  var d = parseDateText(value);
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  return value + " (" + days[d.getDay()] + ")";
}
function leaveDateValue(input) {
  return input ? (input.dataset.date || input.value || "") : "";
}
function setLeaveDateInput(input, value) {
  if (!input) return;
  input.dataset.date = value || "";
  input.value = leaveDateInputText(value);
}
function resetLeaveEditState() {
  editingLeaveRangeDates = [];
  document.querySelectorAll(".leave-item.editing").forEach(function(item) {
    item.classList.remove("editing");
    var editButton = item.querySelector("button");
    if (editButton) editButton.textContent = "수정";
  });
  if (leaveSaveBtn) leaveSaveBtn.textContent = "연차 저장";
  if (leaveHelp) leaveHelp.textContent = "시작일과 종료일을 선택하면 해당 기간이 모두 연차로 표시됩니다.";
}
function groupLeaveRanges(rows) {
  var seen = {};
  var dates = rows
    .filter(function(row) { return row.status === "leave"; })
    .map(function(row) { return row.date; })
    .filter(function(date) {
      if (seen[date]) return false;
      seen[date] = true;
      return true;
    })
    .sort();
  var ranges = [];
  dates.forEach(function(date) {
    var last = ranges[ranges.length - 1];
    if (last && dateText(addDays(parseDateText(last.end), 1)) === date) {
      last.end = date;
      last.dates.push(date);
    } else {
      ranges.push({ start: date, end: date, dates: [date] });
    }
  });
  return ranges;
}
function renderLeaveList(message) {
  if (!leaveList) return;
  leaveList.textContent = "";
  if (message) {
    var msg = document.createElement("div");
    msg.className = "leave-empty";
    msg.textContent = message;
    leaveList.appendChild(msg);
    return;
  }
  var ranges = groupLeaveRanges(ownerLeaveRows);
  if (!ranges.length) {
    var empty = document.createElement("div");
    empty.className = "leave-empty";
    empty.textContent = "저장된 연차가 없습니다.";
    leaveList.appendChild(empty);
    return;
  }
  ranges.forEach(function(range) {
    var item = document.createElement("div");
    item.className = "leave-item";
    var text = document.createElement("span");
    text.textContent = leaveRangeText(range);
    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn";
    edit.textContent = "수정";
    edit.addEventListener("click", function() {
      if (item.classList.contains("editing")) {
        resetLeaveEditState();
        setLeaveDateInput(leaveStartDate, selectedTeamDate);
        setLeaveDateInput(leaveEndDate, selectedTeamDate);
        return;
      }
      document.querySelectorAll(".leave-item.editing").forEach(function(row) {
        row.classList.remove("editing");
        var button = row.querySelector("button");
        if (button) button.textContent = "수정";
      });
      item.classList.add("editing");
      edit.textContent = "수정 중";
      editingLeaveRangeDates = range.dates.slice();
      setLeaveDateInput(leaveStartDate, range.start);
      setLeaveDateInput(leaveEndDate, range.end);
      if (leaveSaveBtn) leaveSaveBtn.textContent = "수정 저장";
      if (leaveHelp) leaveHelp.textContent = "날짜를 바꾼 뒤 수정 저장을 누르면 이 연차가 바뀝니다.";
    });
    var del = document.createElement("button");
    del.type = "button";
    del.className = "btn danger";
    del.textContent = "삭제";
    del.addEventListener("click", function() {
      showNotice(leaveRangeText(range) + " 연차를 삭제합니다.", "danger", "삭제", function() {
        hideNotice();
        deleteLeaveDates(range.dates).catch(function(error) {
          showNotice("연차 삭제 실패: " + error.message, "danger");
        });
      }, true);
    });
    item.appendChild(text);
    item.appendChild(edit);
    item.appendChild(del);
    leaveList.appendChild(item);
  });
}
async function loadOwnerLeaveRows(owner) {
  ownerLeaveRows = await completionApi("GET", null, "?owner=" + encodeURIComponent(owner) + "&status=leave");
  renderLeaveList();
}
async function openAnnualLeaveModal() {
  var owner = currentOwnerName();
  if (!owner) {
    showNotice("작성하기에서 담당자 이름을 먼저 선택해주세요.", "danger");
    return;
  }

  resetLeaveEditState();
  if (leaveTitle) leaveTitle.textContent = owner + " 연차 설정";
  setLeaveDateInput(leaveStartDate, selectedTeamDate);
  setLeaveDateInput(leaveEndDate, selectedTeamDate);
  renderLeaveList("연차 목록을 불러오는 중입니다.");
  if (leaveOverlay) {
    leaveOverlay.classList.add("active");
    leaveOverlay.setAttribute("aria-hidden", "false");
  }
  try {
    await loadOwnerLeaveRows(owner);
  } catch (error) {
    renderLeaveList("연차 목록을 불러오지 못했습니다. Supabase의 daily_completions status 컬럼을 확인해주세요.");
  }
}
function closeAnnualLeaveModal() {
  if (!leaveOverlay) return;
  leaveOverlay.classList.remove("active");
  leaveOverlay.setAttribute("aria-hidden", "true");
}
async function saveAnnualLeaveRange() {
  var owner = currentOwnerName();
  if (!owner) {
    showNotice("작성하기에서 담당자 이름을 먼저 선택해주세요.", "danger");
    return;
  }

  var beforeStats = completionStats();
  var dates = datesBetween(leaveDateValue(leaveStartDate), leaveDateValue(leaveEndDate));
  if (!dates.length) {
    showNotice("시작일과 종료일을 올바르게 선택해주세요.", "danger");
    return;
  }

  if (editingLeaveRangeDates.length) {
    await Promise.all(editingLeaveRangeDates.map(function(date) {
      return completionApi("DELETE", null, "?date=" + encodeURIComponent(date) + "&owner=" + encodeURIComponent(owner) + "&status=leave");
    }));
  }
  await Promise.all(dates.map(function(date) {
    return completionApi("POST", { date: date, owner: owner, status: "leave" });
  }));
  await loadCompletionsForSelectedDate(true);
  await loadOwnerLeaveRows(owner);
  resetLeaveEditState();
  render();

  var afterStats = completionStats();
  if (!beforeStats.allResolved && afterStats.allResolved) {
    showAllResolvedNotice();
  } else {
    showNotice("연차를 저장했습니다.");
  }
}
async function deleteLeaveDates(dates) {
  var owner = currentOwnerName();
  if (!owner) {
    showNotice("작성하기에서 담당자 이름을 먼저 선택해주세요.", "danger");
    return;
  }
  if (!dates.length) {
    showNotice("삭제할 연차가 없습니다.", "danger");
    return;
  }

  await Promise.all(dates.map(function(date) {
    return completionApi("DELETE", null, "?date=" + encodeURIComponent(date) + "&owner=" + encodeURIComponent(owner) + "&status=leave");
  }));
  await loadCompletionsForSelectedDate(true);
  await loadOwnerLeaveRows(owner);
  resetLeaveEditState();
  setLeaveDateInput(leaveStartDate, selectedTeamDate);
  setLeaveDateInput(leaveEndDate, selectedTeamDate);
  render();
  showNotice("연차를 삭제했습니다.");
}
function groupByOwner(items) {
  var map = {};
  ownerNames.forEach(function(owner) {
    map[owner] = [];
  });
  items.forEach(function(item) {
    if (map[item.owner]) map[item.owner].push(item);
  });
  return ownerNames.map(function(owner) {
    return { owner: owner, items: map[owner], summary: summarize(map[owner]) };
  });
}
function ownerCount() {
  return ownerNames.length;
}
function ownerAchievementRate(amount) {
  return Math.round((Number(amount) || 0) / 2000000 * 100);
}

function prescriptionButton(item) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn " + (item.prescriptionDone ? "done" : "pending");
  button.textContent = item.prescriptionDone ? "통계입력 완료" : "미완료";
  button.addEventListener("click", function(e) {
    e.stopPropagation();
    togglePrescription(item).catch(function(error) {
      status("처방입력 변경 실패: " + error.message, "error");
      toast(error.message);
    });
  });
  return button;
}
function reportCard(item, index) {
  var card = document.createElement("div");
  card.className = "report-card " + typeClass(item.type);

  var number = document.createElement("div");
  number.className = "report-number";
  number.textContent = String(index + 1);

  var top = document.createElement("div");
  top.className = "report-top";
  var clientWrap = document.createElement("div");
  clientWrap.className = "client-wrap";
  var client = document.createElement("div");
  client.className = "client";
  client.textContent = item.client;
  clientWrap.appendChild(client);
  if (item.branchName) {
    var branch = document.createElement("span");
    branch.className = "branch-name";
    branch.textContent = item.branchName;
    clientWrap.appendChild(branch);
  }
  var amount = document.createElement("div");
  amount.className = "report-amount";
  amount.textContent = won(item.amount);
  top.appendChild(clientWrap);
  top.appendChild(amount);

  var info = document.createElement("div");
  info.className = "report-info";
  info.textContent = item.date + " · 수거 " + collectionMonthOf(item) + "월 · " + item.product;

  var bottom = document.createElement("div");
  bottom.className = "report-bottom";
  var badge = document.createElement("span");
  badge.className = "badge " + typeClass(item.type);
  badge.textContent = item.type;

  var actions = document.createElement("div");
  actions.className = "report-actions";
  actions.appendChild(prescriptionButton(item));

  var edit = document.createElement("button");
  edit.className = "btn";
  edit.type = "button";
  edit.textContent = "수정";
  edit.addEventListener("click", function(e) {
    e.stopPropagation();
    startEdit(item);
  });

  var del = document.createElement("button");
  del.className = "btn danger";
  del.type = "button";
  del.textContent = "삭제";
  del.addEventListener("click", function(e) {
    e.stopPropagation();
    deleteData(item.id).catch(function(error) {
      status("삭제 실패: " + error.message, "error");
      toast(error.message);
    });
  });

  actions.appendChild(edit);
  actions.appendChild(del);
  bottom.appendChild(badge);
  bottom.appendChild(actions);

  card.appendChild(number);
  card.appendChild(top);
  card.appendChild(info);
  card.appendChild(bottom);
  return card;
}
function addDetailMetric(parent, owner, filterType, value, sub) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "detail-metric" + (ownerFilters[owner] === filterType ? " active" : "");
  button.addEventListener("click", function(e) {
    e.stopPropagation();
    ownerFilters[owner] = ownerFilters[owner] === filterType ? "" : filterType;
    render();
  });

  var span = document.createElement("span");
  span.textContent = filterType;
  var strong = document.createElement("strong");
  strong.textContent = value;
  var small = document.createElement("span");
  small.textContent = sub;

  button.appendChild(span);
  button.appendChild(strong);
  button.appendChild(small);
  parent.appendChild(button);
}
function renderOwnerCards(items) {
  ownerCards.textContent = "";

  groupByOwner(items).sort(function(a, b) {
    var rateDiff = ownerAchievementRate(b.summary.total.amount) - ownerAchievementRate(a.summary.total.amount);
    if (rateDiff !== 0) return rateDiff;
    var amountDiff = b.summary.total.amount - a.summary.total.amount;
    if (amountDiff !== 0) return amountDiff;
    return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
  }).forEach(function(group) {
    var summary = group.summary;
    var achievementRate = ownerAchievementRate(summary.total.amount);
    var card = document.createElement("div");
    card.className = "owner-card" + (openedOwner === group.owner ? " open" : "");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "owner-button" + (openedOwner === group.owner ? " active" : "");
    button.addEventListener("click", function() {
      openedOwner = openedOwner === group.owner ? "" : group.owner;
      render();
    });

    var name = document.createElement("div");
    name.className = "owner-name";
    name.textContent = group.owner;
    var line = document.createElement("div");
    line.className = "owner-line";
    var newCount = document.createElement("span");
    newCount.className = "owner-count";
    newCount.textContent = "신규" + summary.new.count;
    var growthCount = document.createElement("span");
    growthCount.className = "owner-count";
    growthCount.textContent = "증대" + summary.growth.count;
    var rate = document.createElement("span");
    rate.className = "owner-rate";
    rate.textContent = achievementRate + "%";
    line.appendChild(newCount);
    line.appendChild(growthCount);
    line.appendChild(rate);
    button.appendChild(name);
    button.appendChild(line);

    var detailSummary = document.createElement("div");
    detailSummary.className = "owner-detail-summary";
    addDetailMetric(detailSummary, group.owner, "신규", won(summary.new.amount), summary.new.count + "건");
    addDetailMetric(detailSummary, group.owner, "매출증대", won(summary.growth.amount), summary.growth.count + "건");

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn detail-reset";
    reset.textContent = ownerFilters[group.owner] ? "전체 보기" : "전체";
    reset.addEventListener("click", function(e) {
      e.stopPropagation();
      ownerFilters[group.owner] = "";
      render();
    });
    detailSummary.appendChild(reset);

    var detail = document.createElement("div");
    detail.className = "detail-list";

    var filterType = ownerFilters[group.owner];
    group.items
      .filter(function(item) { return !filterType || item.type === filterType; })
      .slice()
      .sort(function(a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); })
      .forEach(function(item, index) {
        detail.appendChild(reportCard(item, index));
      });

    if (!detail.children.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "해당 구분의 거래처가 없습니다.";
      detail.appendChild(empty);
    }

    card.appendChild(button);
    card.appendChild(detailSummary);
    card.appendChild(detail);
    ownerCards.appendChild(card);
  });
}
function renderTeamCards(items) {
  if (!todayOwnerCards) return;
  todayOwnerCards.textContent = "";
  var statusMap = dailyStatusMap();

  groupByOwner(items).sort(function(a, b) {
    var amountDiff = b.summary.total.amount - a.summary.total.amount;
    if (amountDiff !== 0) return amountDiff;
    return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
  }).forEach(function(group) {
    var summary = group.summary;
    var card = document.createElement("div");
    var status = selectedTeamPeriod === "day" ? (statusMap[group.owner] || "missing") : "";
    card.className = "owner-card" +
      (openedTeamOwner === group.owner ? " open" : "") +
      (status === "done" ? " report-done" : "") +
      (status === "leave" ? " report-leave" : "");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "owner-button" + (openedTeamOwner === group.owner ? " active" : "");
    button.addEventListener("click", function() {
      openedTeamOwner = openedTeamOwner === group.owner ? "" : group.owner;
      render();
    });

    var name = document.createElement("div");
    name.className = "owner-name";
    name.textContent = group.owner;

    var title = document.createElement("div");
    title.className = "owner-title";
    title.appendChild(name);
    if (selectedTeamPeriod === "day") {
      var statusBadge = document.createElement("span");
      statusBadge.className = "daily-status " + status;
      statusBadge.textContent = dailyStatusLabel(status);
      title.appendChild(statusBadge);
    }

    var line = document.createElement("div");
    line.className = "team-line";
    var teamNew = document.createElement("span");
    teamNew.className = "team-count";
    teamNew.textContent = "신규" + summary.new.count;
    var teamGrowth = document.createElement("span");
    teamGrowth.className = "team-count";
    teamGrowth.textContent = "증대" + summary.growth.count;
    var teamAmount = document.createElement("span");
    teamAmount.className = "team-amount";
    teamAmount.textContent = won(summary.total.amount);
    line.appendChild(teamNew);
    line.appendChild(teamGrowth);
    line.appendChild(teamAmount);

    button.appendChild(title);
    button.appendChild(line);

    var detail = document.createElement("div");
    detail.className = "detail-list";
    group.items
      .slice()
      .sort(function(a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); })
      .forEach(function(item, index) {
        detail.appendChild(reportCard(item, index));
      });

    if (!detail.children.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = selectedTeamPeriod === "week" ? "선택한 주의 보고가 없습니다." : "선택한 날짜의 보고가 없습니다.";
      detail.appendChild(empty);
    }

    card.appendChild(button);
    card.appendChild(detail);
    todayOwnerCards.appendChild(card);
  });
}
function teamGroupsForScreenshot(items) {
  return groupByOwner(items).sort(function(a, b) {
    var amountDiff = b.summary.total.amount - a.summary.total.amount;
    if (amountDiff !== 0) return amountDiff;
    return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
  });
}
function downloadCanvas(canvas, filename) {
  var link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
function drawRoundedBox(ctx, x, y, w, h, color, stroke) {
  ctx.fillStyle = color;
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    return;
  }
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }
}
function makeTeamScreenshot(period) {
  var isWeek = period === "week";
  var range = monthBoundedWeekRange();
  var items = reports.filter(function(item) {
    if (ownerNames.indexOf(item.owner) < 0) return false;
    if (isWeek) {
      return item.date >= range.start &&
        item.date <= range.end &&
        isWeekdayDate(parseDateText(item.date));
    }
    return item.date === selectedTeamDate;
  });
  var summary = summarize(items);
  var groups = teamGroupsForScreenshot(items);
  var stats = completionStats();
  var width = 430;
  var rowHeight = 52;
  var height = 220 + groups.length * rowHeight;
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4f7f5";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#17211c";
  ctx.font = "900 25px Malgun Gothic, sans-serif";
  ctx.fillText(isWeek ? "주간현황" : "일일현황", 22, 42);
  ctx.font = "700 14px Malgun Gothic, sans-serif";
  ctx.fillStyle = "#66736d";
  ctx.fillText(isWeek ? weekLabelFromStart(selectedWeekStart) + " (" + range.start + " ~ " + range.end + ")" : dayLabel(selectedTeamDate), 22, 66);

  var boxY = 86;
  var boxW = 124;
  [
    ["전체", wonMan(summary.total.amount), summary.total.count + "건"],
    ["신규", wonMan(summary.new.amount), summary.new.count + "건"],
    ["매출증대", wonMan(summary.growth.amount), summary.growth.count + "건"]
  ].forEach(function(box, index) {
    var x = 22 + index * (boxW + 8);
    drawRoundedBox(ctx, x, boxY, boxW, 82, "#ffffff", "#d9e2dc");
    ctx.fillStyle = "#66736d";
    ctx.font = "700 13px Malgun Gothic, sans-serif";
    ctx.fillText(box[0], x + 12, boxY + 24);
    ctx.fillStyle = "#17211c";
    ctx.font = "900 17px Malgun Gothic, sans-serif";
    ctx.fillText(box[1], x + 12, boxY + 52);
    ctx.fillStyle = "#66736d";
    ctx.font = "700 12px Malgun Gothic, sans-serif";
    ctx.fillText(box[2], x + 12, boxY + 72);
  });

  var y = 202;
  groups.forEach(function(group) {
    var status = !isWeek ? (stats.statusMap[group.owner] || "missing") : "";
    var bg = status === "done" ? "#edf9f4" : (status === "leave" ? "#f7f8f7" : "#ffffff");
    drawRoundedBox(ctx, 22, y - 24, width - 44, 42, bg, "#d9e2dc");
    ctx.fillStyle = "#17211c";
    ctx.font = "900 17px Malgun Gothic, sans-serif";
    ctx.fillText(group.owner, 36, y + 3);
    if (!isWeek && status === "leave") {
      ctx.fillStyle = "#7b8580";
      ctx.font = "900 12px Malgun Gothic, sans-serif";
      ctx.fillText("연차", 92, y + 2);
    }
    ctx.fillStyle = "#66736d";
    ctx.font = "800 13px Malgun Gothic, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("신규" + group.summary.new.count, 246, y + 2);
    ctx.fillText("증대" + group.summary.growth.count, 294, y + 2);
    ctx.fillStyle = "#17211c";
    ctx.font = "900 15px Malgun Gothic, sans-serif";
    ctx.fillText(won(group.summary.total.amount), width - 36, y + 3);
    ctx.textAlign = "left";
    y += rowHeight;
  });

  return canvas;
}
function downloadDayScreenshot() {
  downloadCanvas(makeTeamScreenshot("day"), "일일현황-" + selectedTeamDate + ".png");
}
function downloadWeekScreenshot() {
  downloadCanvas(makeTeamScreenshot("week"), "주간현황-" + weekLabelFromStart(selectedWeekStart).replace(/\s+/g, "") + ".png");
}
function render() {
  var items = monthlyItems();
  var teamItems = teamPeriodItems();
  var summary = summarize(items);
  var teamSummary = summarize(teamItems);
  var targetAmount = ownerCount() * 2000000;
  var achievementRate = targetAmount ? Math.round(summary.total.amount / targetAmount * 100) : 0;

  syncMonthPicker();
  syncTeamPeriodControls();
  renderCompletionPanel();
  document.getElementById("totalAmount").textContent = wonMan(summary.total.amount);
  document.getElementById("totalCount").textContent = summary.total.count + "건";
  document.getElementById("newAmount").textContent = wonMan(summary.new.amount);
  document.getElementById("newCount").textContent = summary.new.count + "건";
  document.getElementById("growthAmount").textContent = wonMan(summary.growth.amount);
  document.getElementById("growthCount").textContent = summary.growth.count + "건";
  document.getElementById("doneRate").textContent = achievementRate + "%";
  document.getElementById("doneCount").textContent = "총매출 " + wonMan(summary.total.amount) + " / 목표 " + wonMan(targetAmount);
  document.getElementById("empty").style.display = items.length ? "none" : "block";
  renderOwnerCards(items);

  document.getElementById("todayTotalAmount").textContent = wonMan(teamSummary.total.amount);
  document.getElementById("todayTotalCount").textContent = teamSummary.total.count + "건";
  document.getElementById("todayNewAmount").textContent = wonMan(teamSummary.new.amount);
  document.getElementById("todayNewCount").textContent = teamSummary.new.count + "건";
  document.getElementById("todayGrowthAmount").textContent = wonMan(teamSummary.growth.amount);
  document.getElementById("todayGrowthCount").textContent = teamSummary.growth.count + "건";
  if (todayEmpty) {
    todayEmpty.textContent = selectedTeamPeriod === "week" ? "선택한 주의 보고가 없습니다." : "선택한 날짜의 보고가 없습니다.";
    todayEmpty.style.display = teamItems.length ? "none" : "block";
  }
  renderTeamCards(teamItems);
  if (weeklyReportPanel && weeklyReportPanel.classList.contains("active")) {
    updateWeeklyReportPreview();
  }
}
function resetAfterSave() {
  editingId = "";
  clientInput.value = "";
  if (branchInput) branchInput.value = "";
  productInput.value = "클로르";
  amountInput.value = "";
  selectedType = "신규";
  setDefaultCollectionMonth();
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "저장";
  clientInput.focus();
}
function resetFormAll() {
  editingId = "";
  clientInput.value = "";
  if (branchInput) branchInput.value = "";
  productInput.value = "클로르";
  amountInput.value = "";
  setLeaveDateInput(dateInput, todayText);
  selectedType = "신규";
  setDefaultCollectionMonth();
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "저장";
}
function startEdit(item) {
  editingId = item.id;
  ownerInput.value = item.owner;
  setLeaveDateInput(dateInput, item.date);
  clientInput.value = item.client;
  if (branchInput) branchInput.value = item.branchName || "";
  productInput.value = item.product;
  amountInput.value = String(Math.round(Number(item.amount || 0) / 10000));
  selectedType = item.type;
  collectionYear = collectionYearOf(item);
  collectionMonth = collectionMonthOf(item);
  syncCollectionButtons();
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "수정 저장";
  document.body.classList.add("view-form");
  document.body.classList.remove("view-dashboard");
  document.body.classList.remove("view-today");
  document.querySelectorAll("[data-view]").forEach(function(tab) {
    tab.classList.toggle("active", tab.dataset.view === "form");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

syncCollectionButtons();
syncTeamPeriodControls();

if (noticeOkBtn) {
  noticeOkBtn.addEventListener("click", hideNotice);
}
if (noticeActionBtn) {
  noticeActionBtn.addEventListener("click", function() {
    if (noticeActionHandler) noticeActionHandler();
  });
}
if (noticeOverlay) {
  noticeOverlay.addEventListener("click", function(e) {
    if (e.target === noticeOverlay && !noticeLocked) hideNotice();
  });
}
if (completeDayBtn) {
  completeDayBtn.addEventListener("click", function() {
    markDailyComplete().catch(function(error) {
      showNotice("완료 처리 실패: " + error.message, "danger");
    });
  });
}
if (leaveDayBtn) {
  leaveDayBtn.addEventListener("click", function() {
    openAnnualLeaveModal().catch(function(error) {
      showNotice("연차 목록 불러오기 실패: " + error.message, "danger");
    });
  });
}
if (leaveSaveBtn) {
  leaveSaveBtn.addEventListener("click", function() {
    saveAnnualLeaveRange().catch(function(error) {
      showNotice("연차 저장 실패: " + error.message, "danger");
    });
  });
}
if (leaveCloseBtn) {
  leaveCloseBtn.addEventListener("click", closeAnnualLeaveModal);
}
if (leaveOverlay) {
  leaveOverlay.addEventListener("click", function(e) {
    if (e.target === leaveOverlay) closeAnnualLeaveModal();
  });
}
if (leaveStartDate) {
  leaveStartDate.addEventListener("click", function() {
    openCalendar("leaveStart", leaveDateValue(leaveStartDate) || selectedTeamDate);
  });
}
if (leaveEndDate) {
  leaveEndDate.addEventListener("click", function() {
    openCalendar("leaveEnd", leaveDateValue(leaveEndDate) || selectedTeamDate);
  });
}
if (dateInput) {
  dateInput.addEventListener("click", function() {
    openCalendar("formDate", leaveDateValue(dateInput) || todayText);
  });
}
if (dayScreenshotBtn) {
  dayScreenshotBtn.addEventListener("click", downloadResolvedScreenshot);
}
if (weekScreenshotBtn) {
  weekScreenshotBtn.addEventListener("click", downloadWeekScreenshot);
}
if (copyWeeklyReportBtn) {
  copyWeeklyReportBtn.addEventListener("click", function() {
    openWeeklyReportPanel();
  });
}
if (weeklyDateToggleBtn) {
  weeklyDateToggleBtn.addEventListener("click", toggleWeeklyDateSettings);
}
if (weeklyReportStart) {
  weeklyReportStart.addEventListener("click", function() {
    openCalendar("weeklyStart", leaveDateValue(weeklyReportStart) || selectedWeekStart);
  });
}
if (weeklyReportEnd) {
  weeklyReportEnd.addEventListener("click", function() {
    openCalendar("weeklyEnd", leaveDateValue(weeklyReportEnd) || dateText(addDays(parseDateText(selectedWeekStart), 4)));
  });
}
if (closeWeeklyReportBtn) {
  closeWeeklyReportBtn.addEventListener("click", closeWeeklyReportPanel);
}
if (weeklyReportPanel) {
  weeklyReportPanel.addEventListener("click", function(e) {
    if (e.target === weeklyReportPanel) closeWeeklyReportPanel();
  });
}
if (confirmCopyWeeklyReportBtn) {
  confirmCopyWeeklyReportBtn.addEventListener("click", function() {
    copyWeeklyReportText().catch(function(error) {
      showNotice("카톡 보고 복사 실패: " + error.message, "danger");
    });
  });
}
ownerInput.addEventListener("change", function() {
  var owner = ownerInput.value.trim();
  if (ownerNames.indexOf(owner) >= 0) {
    localStorage.setItem("ownerName", owner);
  }
  renderCompletionPanel();
});
amountInput.addEventListener("input", function() {
  amountInput.value = digits(amountInput.value);
  updateAmountPreview();
});
document.querySelectorAll("[data-add-amount]").forEach(function(button) {
  button.addEventListener("click", function() {
    amountInput.value = String(amountMan(amountInput.value) + Number(button.dataset.addAmount || 0));
    updateAmountPreview();
  });
});
document.querySelectorAll("[data-type]").forEach(function(button) {
  button.addEventListener("click", function() {
    selectedType = button.dataset.type;
    updateTypeButtons();
  });
});
document.getElementById("prevCollectionBtn").addEventListener("click", function() { moveCollectionMonth(-1); });
document.getElementById("nextCollectionBtn").addEventListener("click", function() { moveCollectionMonth(1); });
document.getElementById("prevMonthBtn").addEventListener("click", function() { moveMonth(-1); });
document.getElementById("nextMonthBtn").addEventListener("click", function() { moveMonth(1); });
document.getElementById("currentMonthBtn").addEventListener("click", resetToCurrentMonth);
document.getElementById("cancelEditBtn").addEventListener("click", resetFormAll);
document.querySelectorAll("[data-view]").forEach(function(button) {
  button.addEventListener("click", function() {
    var view = button.dataset.view;
    document.body.classList.toggle("view-form", view === "form");
    document.body.classList.toggle("view-dashboard", view === "dashboard");
    document.body.classList.toggle("view-today", view === "today");
    document.querySelectorAll("[data-view]").forEach(function(tab) {
      tab.classList.toggle("active", tab.dataset.view === view);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
document.querySelectorAll("[data-period]").forEach(function(button) {
  button.addEventListener("click", function() {
    selectedTeamPeriod = button.dataset.period;
    openedTeamOwner = "";
    document.querySelectorAll("[data-period]").forEach(function(periodButton) {
      periodButton.classList.toggle("active", periodButton.dataset.period === selectedTeamPeriod);
    });
    if (selectedTeamPeriod === "day") {
      loadCompletionsForSelectedDate();
    } else {
      setDefaultWeeklyReportRange();
      render();
    }
  });
});
if (teamDatePicker) {
  teamDatePicker.addEventListener("change", function() {
    selectedTeamDate = teamDatePicker.value || todayText;
    openedTeamOwner = "";
    loadCompletionsForSelectedDate();
  });
}
if (teamDateLabel) {
  teamDateLabel.addEventListener("click", function() {
    openCalendar("day", selectedTeamDate);
  });
}
document.getElementById("prevDayBtn").addEventListener("click", function() {
  selectedTeamDate = nextWeekdayText(selectedTeamDate, -1);
  openedTeamOwner = "";
  loadCompletionsForSelectedDate();
});
document.getElementById("nextDayBtn").addEventListener("click", function() {
  selectedTeamDate = nextWeekdayText(selectedTeamDate, 1);
  openedTeamOwner = "";
  loadCompletionsForSelectedDate();
});
if (teamWeekPicker) {
  teamWeekPicker.addEventListener("change", function() {
    selectedWeekStart = dateText(startOfWeekDate(parseDateText(teamWeekPicker.value || todayText)));
    setDefaultWeeklyReportRange();
    openedTeamOwner = "";
    render();
  });
}
if (teamWeekLabel) {
  teamWeekLabel.addEventListener("click", function() {
    openCalendar("week", selectedWeekStart);
  });
}
if (calendarPrevBtn) {
  calendarPrevBtn.addEventListener("click", function() {
    calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1);
    renderCalendar();
  });
}
if (calendarNextBtn) {
  calendarNextBtn.addEventListener("click", function() {
    calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1);
    renderCalendar();
  });
}
if (calendarTodayBtn) {
  calendarTodayBtn.addEventListener("click", function() {
    applyCalendarDate(todayText);
  });
}
if (calendarCloseBtn) {
  calendarCloseBtn.addEventListener("click", closeCalendar);
}
if (calendarOverlay) {
  calendarOverlay.addEventListener("click", function(e) {
    if (e.target === calendarOverlay) closeCalendar();
  });
}
document.getElementById("prevWeekBtn").addEventListener("click", function() {
  selectedWeekStart = dateText(addDays(parseDateText(selectedWeekStart), -7));
  setDefaultWeeklyReportRange();
  openedTeamOwner = "";
  render();
});
document.getElementById("nextWeekBtn").addEventListener("click", function() {
  selectedWeekStart = dateText(addDays(parseDateText(selectedWeekStart), 7));
  setDefaultWeeklyReportRange();
  openedTeamOwner = "";
  render();
});
monthPicker.addEventListener("change", function() {
  if (!monthPicker.value) return;
  var parts = monthPicker.value.split("-");
  selectedYear = Number(parts[0]);
  selectedMonth = Number(parts[1]);
  render();
});

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  var owner = ownerInput.value.trim();
  if (!owner) {
    toast("담당자 이름을 선택해주세요.");
    return;
  }
  if (!clientInput.value.trim()) {
    toast("거래처명을 입력해주세요.");
    clientInput.focus();
    return;
  }
  if (!productInput.value) {
    toast("품목을 선택해주세요.");
    productInput.focus();
    return;
  }
  if (!amountWon(amountInput.value)) {
    toast("예상 금액을 입력해주세요.");
    amountInput.focus();
    return;
  }

  localStorage.setItem("ownerName", owner);

  var reportDate = leaveDateValue(dateInput);
  if (!reportDate) {
    showNotice("날짜를 선택해주세요.", "danger");
    return;
  }
  if (isWeekendDateText(reportDate)) {
    showNotice("주말에는 거래처 입력이 불가능합니다. 다른 날짜를 선택해주세요.", "danger");
    return;
  }

  var old = reports.find(function(report) { return report.id === editingId; }) || {};
  var item = {
    id: editingId || makeId(),
    createdAt: old.createdAt || Date.now(),
    updatedAt: Date.now(),
    date: reportDate,
    owner: owner,
    client: clientInput.value.trim(),
    branchName: branchInput ? branchInput.value.trim() : "",
    type: selectedType,
    product: productInput.value,
    amount: amountWon(amountInput.value),
    collectionYear: collectionYear,
    collectionMonth: collectionMonth,
    prescriptionDone: Boolean(old.prescriptionDone)
  };

  var duplicate = findDuplicateReport(item);
  if (duplicate) {
    var keepSaving = confirm(
      "이미 등록된 거래처입니다.\n\n" +
      "담당자: " + duplicate.owner + "\n" +
      "거래처: " + duplicate.client + "\n" +
      "기존 입력: " + duplicate.type + " / 통계 수거 " + collectionText(duplicate) + "\n\n" +
      "그래도 저장할까요?"
    );
    if (!keepSaving) return;
  }

  try {
    var wasEditing = Boolean(editingId);
    if (wasEditing) await updateData(item);
    else {
      await addData(item, true);
      askCompleteAfterSave(owner, item.date);
    }
    resetAfterSave();
  } catch (error) {
    status("저장 실패: " + error.message, "error");
    toast(error.message);
  }
});

syncMonthPicker();
setDefaultWeeklyReportRange();
updateAmountPreview();
loadData().catch(function(error) {
  status("연결 실패: " + error.message, "error");
});
