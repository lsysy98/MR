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
var weeklyLeaveRows = [];
var teamCalendarDays = [];
var exhibitionEvents = [];
var calendarLoadError = "";
var exhibitionLoadError = "";
var adminKey = "";
var completionLoadError = "";
var selectedType = "신규";
var selectedTeamPeriod = "day";
var selectedTeamDate = todayText;
var selectedWeekStart = dateText(startOfWeekDate(today));
var selectedWeekYear = today.getFullYear();
var selectedWeekMonth = today.getMonth() + 1;
var openedOwner = "";
var openedTeamOwner = "";
var openedReportId = "";
var selectedMeetingOwner = "";
var ownerFilters = {};
var committedOwnerSearchTerm = "";
var editingId = "";
var ownerNames = ["성진욱", "김무영", "이승엽", "김태홍", "제성규", "송진영", "이현욱"];
var productGroups = [
  { group: "항생제", items: ["아목시스", "아목시클라", "세파클리"] },
  { group: "진통제", items: ["록소리펜", "나프록소", "아세클로페낙"] },
  { group: "소화기제", items: ["알마펜", "모사프리", "에스오메프라졸"] },
  { group: "구강소독제", items: ["클로르 100ml", "클로르 15ml"] }
];
var productCategoryOrder = ["항생제", "진통제", "소화기제", "구강소독제"];
var productRepresentativeOrder = ["항생제", "진통제", "소화기제"];
var productOptionSet = productGroups.reduce(function(map, group) {
  group.items.forEach(function(item) { map[item] = true; });
  return map;
}, {});

var form = document.getElementById("reportForm");
var appTitle = document.getElementById("appTitle");
var adminMenuBtn = document.getElementById("adminMenuBtn");
var adminMenu = document.getElementById("adminMenu");
var menuHolidayBtn = document.getElementById("menuHolidayBtn");
var menuExhibitionBtn = document.getElementById("menuExhibitionBtn");
var ownerInput = document.getElementById("owner");
var dateInput = document.getElementById("date");
var clientInput = document.getElementById("client");
var branchInput = document.getElementById("branchName");
var productInput = document.getElementById("product");
var productChooseBtn = document.getElementById("productChooseBtn");
var productChooseText = document.getElementById("productChooseText");
var productSummaryText = document.getElementById("productSummaryText");
var productOverlay = document.getElementById("productOverlay");
var productOptionGroups = document.getElementById("productOptionGroups");
var productClearBtn = document.getElementById("productClearBtn");
var productDoneBtn = document.getElementById("productDoneBtn");
var amountInput = document.getElementById("amount");
var amountPreview = document.getElementById("amountPreview");
var ownerCards = document.getElementById("ownerCards");
var ownerSearchInput = document.getElementById("ownerSearchInput");
var ownerSearchButton = document.getElementById("ownerSearchBtn");
var ownerSearchResults = document.getElementById("ownerSearchResults");
var todayOwnerCards = document.getElementById("todayOwnerCards");
var meetingCards = document.getElementById("meetingCards");
var meetingMonthLabel = document.getElementById("meetingMonthLabel");
var meetingMonthPicker = document.getElementById("meetingMonthPicker");
var meetingPrevMonthBtn = document.getElementById("meetingPrevMonthBtn");
var meetingCurrentMonthBtn = document.getElementById("meetingCurrentMonthBtn");
var meetingNextMonthBtn = document.getElementById("meetingNextMonthBtn");
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
var holidayOverlay = document.getElementById("holidayOverlay");
var holidayDateInput = document.getElementById("holidayDate");
var holidayStatusInput = document.getElementById("holidayStatus");
var holidayLabelInput = document.getElementById("holidayLabel");
var holidayList = document.getElementById("holidayList");
var holidaySaveBtn = document.getElementById("holidaySaveBtn");
var holidayCloseBtn = document.getElementById("holidayCloseBtn");
var exhibitionOverlay = document.getElementById("exhibitionOverlay");
var exhibitionDateInput = document.getElementById("exhibitionDate");
var exhibitionEndDateInput = document.getElementById("exhibitionEndDate");
var exhibitionNameInput = document.getElementById("exhibitionName");
var exhibitionNeededCountInput = document.getElementById("exhibitionNeededCount");
var exhibitionRangeBtn = document.getElementById("exhibitionRangeBtn");
var exhibitionRangeStatus = document.getElementById("exhibitionRangeStatus");
var exhibitionWorkspace = document.getElementById("exhibitionWorkspace");
var exhibitionEditor = document.getElementById("exhibitionEditor");
var exhibitionActions = document.getElementById("exhibitionActions");
var exhibitionFormToggleBtn = document.getElementById("exhibitionFormToggleBtn");
var exhibitionAttendees = document.getElementById("exhibitionAttendees");
var exhibitionMemoInput = document.getElementById("exhibitionMemo");
var exhibitionList = document.getElementById("exhibitionList");
var exhibitionOwnerStats = document.getElementById("exhibitionOwnerStats");
var exhibitionSaveBtn = document.getElementById("exhibitionSaveBtn");
var exhibitionResetBtn = document.getElementById("exhibitionResetBtn");
var exhibitionCloseBtn = document.getElementById("exhibitionCloseBtn");
var exhibitionDetailOverlay = document.getElementById("exhibitionDetailOverlay");
var exhibitionDetailTitle = document.getElementById("exhibitionDetailTitle");
var exhibitionDetailMeta = document.getElementById("exhibitionDetailMeta");
var exhibitionDetailDays = document.getElementById("exhibitionDetailDays");
var exhibitionDetailOwners = document.getElementById("exhibitionDetailOwners");
var exhibitionDetailOwnerInfo = document.getElementById("exhibitionDetailOwnerInfo");
var exhibitionDetailCloseBtn = document.getElementById("exhibitionDetailCloseBtn");
var calendarOverlay = document.getElementById("calendarOverlay");
var calendarTitle = document.getElementById("calendarTitle");
var calendarHint = document.getElementById("calendarHint");
var calendarActions = document.getElementById("calendarActions");
var calendarDays = document.getElementById("calendarDays");
var calendarPrevBtn = document.getElementById("calendarPrevBtn");
var calendarNextBtn = document.getElementById("calendarNextBtn");
var calendarTodayBtn = document.getElementById("calendarTodayBtn");
var calendarConfirmBtn = document.getElementById("calendarConfirmBtn");
var calendarCloseBtn = document.getElementById("calendarCloseBtn");
var noticeOverlay = document.getElementById("noticeOverlay");
var noticeText = document.getElementById("noticeText");
var noticeOkBtn = document.getElementById("noticeOkBtn");
var noticeActions = document.getElementById("noticeActions");
var noticeActionBtn = document.getElementById("noticeActionBtn");
var successCaseOverlay = document.getElementById("successCaseOverlay");
var successCaseClient = document.getElementById("successCaseClient");
var successCaseText = document.getElementById("successCaseText");
var successCaseSaveBtn = document.getElementById("successCaseSaveBtn");
var successCaseCloseBtn = document.getElementById("successCaseCloseBtn");
var noticeActionHandler = null;
var successCaseEditingId = "";
var noticeLocked = false;
var noticeActionRequired = false;
var ownerLeaveRows = [];
var editingLeaveRangeDates = [];
var exhibitionEditingId = "";
var openedExhibitionId = "";
var currentExhibitionDetailId = "";
var selectedExhibitionDetailOwner = "";
var selectedExhibitionStatsOwner = "";
var exhibitionFormVisible = false;
var exhibitionTieOrder = [];
var exhibitionDraftSelections = {};
var exhibitionDraftNeededCounts = {};
var exhibitionDraftDateSet = {};
var exhibitionCalendarDateSet = {};
var calendarMode = "day";
var calendarMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);

setLeaveDateInput(dateInput, todayText);
setLeaveDateInput(exhibitionDateInput, "");
setLeaveDateInput(exhibitionEndDateInput, "");
if (teamDatePicker) teamDatePicker.value = selectedTeamDate;
if (teamWeekPicker) teamWeekPicker.value = selectedWeekStart;
var savedOwnerName = localStorage.getItem("ownerName") || "";
ownerInput.value = ownerNames.indexOf(savedOwnerName) >= 0 ? savedOwnerName : "";
productInput.value = "";
var koreaHolidays = {
  "2026-01-01": true,
  "2026-02-16": true,
  "2026-02-17": true,
  "2026-02-18": true,
  "2026-03-02": true,
  "2026-05-05": true,
  "2026-05-25": true,
  "2026-06-03": true,
  "2026-07-17": true,
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
function setSelectedWeekByDate(value) {
  var date = parseDateText(value || todayText);
  selectedWeekStart = dateText(startOfWeekDate(date));
  selectedWeekYear = date.getFullYear();
  selectedWeekMonth = date.getMonth() + 1;
  if (teamWeekPicker) teamWeekPicker.value = dateText(date);
}
function selectedWeekAnchorText() {
  return monthBoundedWeekRange().start;
}
function weekLabelFromStart(startText) {
  var info = weekMonthInfo(startText);
  var first = new Date(info.year, info.month - 1, 1);
  var firstWeekStart = startOfWeekDate(first);
  var weekStart = parseDateText(startText || selectedWeekStart);
  var weekNo = Math.floor((weekStart - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return info.month + "월 " + weekNo + "주차";
}
function weekNumberOfDateInMonth(value, info) {
  var d = parseDateText(value);
  var first = new Date(info.year, info.month - 1, 1);
  var firstOffset = (first.getDay() + 6) % 7;
  return Math.ceil((d.getDate() + firstOffset) / 7);
}
function weekMonthInfo(startText) {
  if (!startText || startText === selectedWeekStart) {
    return { year: selectedWeekYear, month: selectedWeekMonth };
  }
  var base = parseDateText(startText);
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
function calendarDayOverride(value) {
  return teamCalendarDays.find(function(day) {
    return day.date === value;
  }) || null;
}
function isManualWorkdayDateText(value) {
  var override = calendarDayOverride(value);
  return Boolean(override && override.status === "workday");
}
function isManualHolidayDateText(value) {
  var override = calendarDayOverride(value);
  return Boolean(override && override.status === "holiday");
}
function isKoreanHolidayDateText(value) {
  return Boolean(koreaHolidays[value]);
}
function isNonWorkingDateText(value) {
  if (isManualWorkdayDateText(value)) return false;
  if (isManualHolidayDateText(value)) return true;
  if (isKoreanHolidayDateText(value)) return true;
  return isWeekendDateText(value);
}
function nonWorkingBlockMessage() {
  return calendarMode === "formDate"
    ? "휴일에는 거래처 입력이 불가능합니다. 다른 날짜를 선택해주세요."
    : "휴일에는 일일현황을 조회할 수 없습니다. 다른 날짜를 선택해주세요.";
}
function nextWeekdayText(value, delta) {
  var cursor = parseDateText(value);
  do {
    cursor = addDays(cursor, delta);
  } while (isNonWorkingDateText(dateText(cursor)));
  return dateText(cursor);
}
function moveSelectedWeek(delta) {
  var range = monthBoundedWeekRange();
  var edge = delta > 0 ? range.end : range.start;
  setSelectedWeekByDate(nextWeekdayText(edge, delta));
  setDefaultWeeklyReportRange();
  openedTeamOwner = "";
  render();
}
function isBusinessDate(d) {
  return !isNonWorkingDateText(dateText(d));
}
function firstBusinessDayOfMonth(year, month) {
  var cursor = new Date(year, month - 1, 1);
  while (!isBusinessDate(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return dateText(cursor);
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
  return rest.length > 0 && rest.every(isNonWorkingDateText);
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
function setSelectedMonthFromValue(value) {
  if (!value) return;
  var parts = value.split("-");
  selectedYear = Number(parts[0]);
  selectedMonth = Number(parts[1]);
  syncMonthPicker();
  render();
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
function normalizeSearchText(value) {
  return normalizeClientName(value).toLowerCase();
}
function currentOwnerSearchTerm() {
  return committedOwnerSearchTerm;
}
function submitOwnerSearch() {
  committedOwnerSearchTerm = normalizeSearchText(ownerSearchInput ? ownerSearchInput.value : "");
  if (ownerSearchInput) ownerSearchInput.value = "";
  render();
}
function clearCommittedOwnerSearch() {
  if (!committedOwnerSearchTerm) return;
  committedOwnerSearchTerm = "";
  render();
}
function matchesOwnerSearch(item, term) {
  if (!term) return true;
  return normalizeSearchText(item.client).indexOf(term) >= 0 ||
    normalizeSearchText(item.branchName).indexOf(term) >= 0;
}
function ownerSearchScopeOwner() {
  var owner = openedOwner || currentOwnerName();
  return ownerNames.indexOf(owner) >= 0 ? owner : "";
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
function normalizeDateList(dates) {
  var seen = {};
  return (dates || [])
    .filter(function(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date); })
    .filter(function(date) {
      if (seen[date]) return false;
      seen[date] = true;
      return true;
    })
    .sort();
}
function dateSetFromList(dates) {
  var map = {};
  normalizeDateList(dates).forEach(function(date) {
    map[date] = true;
  });
  return map;
}
function dateListFromSet(dateSet) {
  return normalizeDateList(Object.keys(dateSet || {}).filter(function(date) {
    return dateSet[date];
  }));
}
function setExhibitionDates(dates) {
  var sorted = normalizeDateList(dates);
  exhibitionDraftDateSet = dateSetFromList(sorted);
  setLeaveDateInput(exhibitionDateInput, sorted[0] || "");
  setLeaveDateInput(exhibitionEndDateInput, sorted[sorted.length - 1] || "");
  syncExhibitionDraftDates();
}
function setExhibitionRangeDates(startText, endText) {
  setExhibitionDates(datesBetween(startText, endText || startText));
}
function exhibitionRangeDisplayText() {
  var dates = dateListFromSet(exhibitionDraftDateSet);
  if (!dates.length) return "";
  if (dates.length <= 4) {
    return dates.map(koreanDateShort).join(", ");
  }
  return koreanDateShort(dates[0]) + "~" + koreanDateShort(dates[dates.length - 1]) + " · " + dates.length + "일";
}
function updateExhibitionRangeStatus() {
  var text = exhibitionRangeDisplayText();
  if (exhibitionRangeStatus) {
    exhibitionRangeStatus.innerHTML = text
      ? "<strong>" + text + "</strong>"
      : "전시회 날짜를 선택해주세요.";
  }
  if (exhibitionRangeBtn) exhibitionRangeBtn.textContent = text ? "날짜 다시 선택" : "날짜 선택";
}
function updateCalendarActionState() {
  var isExhibitionPicker = calendarMode === "exhibitionRange";
  if (calendarActions) calendarActions.classList.toggle("range-mode", isExhibitionPicker);
  if (calendarTodayBtn) calendarTodayBtn.style.display = isExhibitionPicker ? "none" : "";
  if (calendarConfirmBtn) calendarConfirmBtn.style.display = isExhibitionPicker ? "block" : "none";
}
function closeCalendar() {
  if (!calendarOverlay) return;
  calendarOverlay.classList.remove("active");
  calendarOverlay.setAttribute("aria-hidden", "true");
  exhibitionCalendarDateSet = {};
  updateCalendarActionState();
}
function openCalendar(mode, value) {
  calendarMode = mode;
  if (mode === "exhibitionRange") exhibitionCalendarDateSet = dateSetFromList(exhibitionSelectedDates());
  var base = parseDateText(value || todayText);
  calendarMonthDate = new Date(base.getFullYear(), base.getMonth(), 1);
  updateCalendarActionState();
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
  if (calendarMode === "holidayDate") return leaveDateValue(holidayDateInput) || todayText;
  if (calendarMode === "exhibitionDate") return leaveDateValue(exhibitionDateInput) || todayText;
  if (calendarMode === "exhibitionEndDate") return leaveDateValue(exhibitionEndDateInput) || leaveDateValue(exhibitionDateInput) || todayText;
  if (calendarMode === "exhibitionRange") return dateListFromSet(exhibitionCalendarDateSet)[0] || todayText;
  return calendarMode === "week" ? selectedWeekAnchorText() : selectedTeamDate;
}
function confirmExhibitionDateSelection() {
  var dates = dateListFromSet(exhibitionCalendarDateSet);
  if (!dates.length) {
    showNotice("전시회 날짜를 한 개 이상 선택해주세요.", "danger");
    return;
  }
  setExhibitionDates(dates);
  renderExhibitionForm();
  closeCalendar();
  showNotice("설정되었습니다.");
}
function applyCalendarDate(selectedKey) {
  if (["formDate", "day", "weeklyStart", "weeklyEnd"].indexOf(calendarMode) >= 0 && isNonWorkingDateText(selectedKey)) {
    showNotice(nonWorkingBlockMessage(), "danger");
    return;
  }
  if (calendarMode === "formDate") {
    setLeaveDateInput(dateInput, selectedKey);
    closeCalendar();
  } else if (calendarMode === "holidayDate") {
    setLeaveDateInput(holidayDateInput, selectedKey);
    closeCalendar();
  } else if (calendarMode === "exhibitionRange") {
    exhibitionCalendarDateSet[selectedKey] = !exhibitionCalendarDateSet[selectedKey];
    renderCalendar();
  } else if (calendarMode === "exhibitionDate") {
    setLeaveDateInput(exhibitionDateInput, selectedKey);
    if (exhibitionEndDateInput && (!leaveDateValue(exhibitionEndDateInput) || leaveDateValue(exhibitionEndDateInput) < selectedKey)) {
      setLeaveDateInput(exhibitionEndDateInput, selectedKey);
    }
    syncExhibitionDraftDates();
    renderExhibitionForm();
    closeCalendar();
  } else if (calendarMode === "exhibitionEndDate") {
    setLeaveDateInput(exhibitionEndDateInput, selectedKey);
    if (exhibitionDateInput && leaveDateValue(exhibitionDateInput) && selectedKey < leaveDateValue(exhibitionDateInput)) {
      setLeaveDateInput(exhibitionDateInput, selectedKey);
    }
    syncExhibitionDraftDates();
    renderExhibitionForm();
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
    setSelectedWeekByDate(selectedKey);
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
  if (calendarHint) {
    var pickedCount = dateListFromSet(exhibitionCalendarDateSet).length;
    calendarHint.textContent = calendarMode === "exhibitionRange"
      ? "전시회 날짜를 하나씩 선택한 뒤 확인을 눌러주세요. 현재 " + pickedCount + "일 선택"
      : "";
  }
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
    var override = calendarDayOverride(key);
    if (override && override.label) btn.title = override.label;
    if (isManualWorkdayDateText(key)) {
      btn.classList.add("workday");
    } else {
      if (!isWeekdayDate(d)) btn.classList.add("weekend");
      if (isKoreanHolidayDateText(key) || isManualHolidayDateText(key)) btn.classList.add("holiday");
    }
    if (key === todayText) btn.classList.add("today");
    if (calendarMode === "exhibitionRange") {
      if (exhibitionCalendarDateSet[key]) btn.classList.add("selected");
    } else if (key === selectedCalendarDateText()) {
      btn.classList.add("selected");
    }
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
function productListFromValue(value) {
  return String(value || "")
    .split(",")
    .map(function(item) { return item.trim(); })
    .filter(Boolean);
}
function productGroupByName(name) {
  return productGroups.find(function(group) {
    return group.items.indexOf(name) >= 0;
  }) || null;
}
function legacyProductGroups(name) {
  if (name === "3제+클로르") return ["항생제", "진통제", "소화기제", "구강소독제"];
  if (name === "3제") return ["항생제", "진통제", "소화기제"];
  if (name === "클로르") return ["구강소독제"];
  return [];
}
function productGroupsFromList(list) {
  var result = {};
  productGroups.forEach(function(group) {
    result[group.group] = group.items.filter(function(item) {
      return list.indexOf(item) >= 0;
    });
  });
  return result;
}
function productComboInfo(value) {
  var list = productListFromValue(value);
  var oralGroups = {};
  var hasChlor = false;
  list.forEach(function(product) {
    var group = productGroupByName(product);
    if (group) {
      if (group.group === "구강소독제") hasChlor = true;
      else oralGroups[group.group] = true;
    }
    legacyProductGroups(product).forEach(function(groupName) {
      if (groupName === "구강소독제") hasChlor = true;
      else oralGroups[groupName] = true;
    });
  });
  var oralCount = Object.keys(oralGroups).length;
  if (oralCount && hasChlor) return { label: oralCount + "제+클로르", key: "oralChlor", oralCount: oralCount, hasChlor: true };
  if (oralCount) return { label: oralCount + "제", key: "oral", oralCount: oralCount, hasChlor: false };
  if (hasChlor) return { label: "클로르", key: "chlor", oralCount: 0, hasChlor: true };
  return { label: productDisplayText(list), key: "other", oralCount: 0, hasChlor: false };
}
function productShortLabel(value) {
  var list = productListFromValue(value);
  if (!list.length) return "";
  var known = list.filter(function(item) { return productOptionSet[item]; });
  var combo = productComboInfo(value);
  if (!known.length) return combo.label || productDisplayText(list);

  var grouped = productGroupsFromList(known);
  if (combo.key === "chlor") {
    var chlorItems = (grouped["구강소독제"] || []).map(function(item) {
      return item.replace(/^클로르\s*/, "");
    });
    return combo.label + (chlorItems.length ? " · " + chlorItems.join(" / ") : "");
  }
  var representative = "";
  productRepresentativeOrder.some(function(groupName) {
    if (grouped[groupName] && grouped[groupName].length) {
      representative = grouped[groupName][0];
      return true;
    }
    return false;
  });
  if (!representative) representative = known[0];
  if (representative && known.length > 1) {
    representative += " 외 " + (known.length - 1) + "건";
  }
  return combo.label ? combo.label + " · " + representative : representative || productDisplayText(list);
}
function selectedProductList() {
  return productListFromValue(productInput ? productInput.value : "");
}
function productDisplayText(list) {
  if (!list.length) return "품목 선택";
  if (list.length <= 2) return list.join(", ");
  return list[0] + " 외 " + (list.length - 1) + "건";
}
function setProductList(list) {
  var seen = {};
  var next = list.filter(function(item) {
    if (!item || seen[item]) return false;
    seen[item] = true;
    return true;
  });
  if (productInput) productInput.value = next.join(", ");
  updateProductSelectionSummary();
  renderProductOptions();
}
function updateProductSelectionSummary() {
  var list = selectedProductList();
  var display = list.length ? productShortLabel(list.join(", ")) : productDisplayText(list);
  if (productChooseText) productChooseText.textContent = display;
  if (productSummaryText) {
    productSummaryText.textContent = list.length ? display : "등록 품목을 선택해주세요.";
  }
  if (productChooseBtn) productChooseBtn.classList.toggle("empty", !list.length);
}
function renderProductOptions() {
  if (!productOptionGroups) return;
  var selected = selectedProductList();
  productOptionGroups.textContent = "";
  productGroups.forEach(function(group) {
    var wrap = document.createElement("div");
    wrap.className = "product-group";
    var title = document.createElement("div");
    title.className = "product-group-title";
    title.textContent = group.group;
    var grid = document.createElement("div");
    grid.className = "product-option-grid";
    group.items.forEach(function(product) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "product-option" + (selected.indexOf(product) >= 0 ? " active" : "");
      btn.textContent = product;
      btn.addEventListener("click", function() {
        toggleProductOption(product);
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(title);
    wrap.appendChild(grid);
    productOptionGroups.appendChild(wrap);
  });
}
function toggleProductOption(product) {
  var selected = selectedProductList().filter(function(item) {
    return productOptionSet[item];
  });
  var index = selected.indexOf(product);
  if (index >= 0) selected.splice(index, 1);
  else selected.push(product);
  setProductList(selected);
}
function openProductModal() {
  renderProductOptions();
  if (!productOverlay) return;
  productOverlay.classList.add("active");
  productOverlay.setAttribute("aria-hidden", "false");
}
function closeProductModal() {
  if (!productOverlay) return;
  productOverlay.classList.remove("active");
  productOverlay.setAttribute("aria-hidden", "true");
}
function updateTypeButtons() {
  document.querySelectorAll("[data-type]").forEach(function(button) {
    button.classList.toggle("active", button.dataset.type === selectedType);
  });
}
function syncMonthPicker() {
  if (monthPicker) monthPicker.value = monthValue();
  if (meetingMonthPicker) meetingMonthPicker.value = monthValue();
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
    teamWeekPicker.value = selectedWeekAnchorText();
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
async function holidayApi(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  return requestJson("/api/holidays" + (query || ""), options, 8000);
}
async function exhibitionApi(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  return requestJson("/api/exhibitions" + (query || ""), options, 8000);
}
function exhibitionErrorMessage(error) {
  var message = error && error.message ? error.message : String(error || "");
  if (/exhibition_event_days|event_day_id|schema cache|relation/i.test(message)) {
    return "전시회 날짜별 저장용 SQL이 아직 적용되지 않았습니다. 원본 Supabase SQL을 한 번 실행해주세요.";
  }
  return message;
}
async function loadCalendarDays(skipRender) {
  try {
    teamCalendarDays = await holidayApi("GET");
    calendarLoadError = "";
  } catch (error) {
    teamCalendarDays = [];
    calendarLoadError = error.message;
  }
  if (!skipRender) render();
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
async function loadExhibitions() {
  try {
    exhibitionEvents = await exhibitionApi("GET");
    exhibitionLoadError = "";
  } catch (error) {
    exhibitionEvents = [];
    exhibitionLoadError = error.message;
  }
  renderExhibitionForm();
  renderExhibitionList();
}
async function loadData() {
  status("보고 데이터를 불러오는 중입니다.", "");
  await loadCalendarDays(true);
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
        isBusinessDate(parseDateText(item.date));
    }
    return item.date === selectedTeamDate;
  });
}
function dateRangeItems(range) {
  return reports.filter(function(item) {
    return ownerNames.indexOf(item.owner) >= 0 &&
      item.date >= range.start &&
      item.date <= range.end &&
      isBusinessDate(parseDateText(item.date));
  });
}
function reportDateMonthItems(year, month) {
  var start = dateText(new Date(year, month - 1, 1));
  var end = dateText(new Date(year, month, 0));
  return reports.filter(function(item) {
    return ownerNames.indexOf(item.owner) >= 0 &&
      item.date >= start &&
      item.date <= end;
  });
}
function koreanMonthDay(value, includeMonth) {
  var d = parseDateText(value);
  return (includeMonth ? (d.getMonth() + 1) + "월 " : "") + d.getDate() + "일";
}
function weekNumbersText(start, end) {
  var numbers = [];
  var info = weekMonthInfo(selectedWeekStart);
  for (var cursor = parseDateText(start); cursor <= parseDateText(end); cursor = addDays(cursor, 1)) {
    if (cursor.getFullYear() !== info.year || cursor.getMonth() + 1 !== info.month) continue;
    var number = weekNumberOfDateInMonth(dateText(cursor), info);
    if (numbers.indexOf(number) < 0) numbers.push(number);
  }
  if (!numbers.length) numbers.push(weekNumberOfDateInMonth(selectedWeekAnchorText(), info));
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
function ownerHasWeeklyLeave(owner, range) {
  return weeklyLeaveRows.some(function(row) {
    return row.owner === owner &&
      (row.status || "") === "leave" &&
      row.date >= range.start &&
      row.date <= range.end;
  });
}
async function refreshWeeklyLeaveRows() {
  var rows = await Promise.all(ownerNames.map(function(owner) {
    return completionApi("GET", null, "?owner=" + encodeURIComponent(owner) + "&status=leave").catch(function() {
      return [];
    });
  }));
  weeklyLeaveRows = rows.reduce(function(all, ownerRows) {
    return all.concat(ownerRows || []);
  }, []);
}
function weeklyReportText() {
  var range = weeklyReportRange();
  var weekItems = dateRangeItems(range);
  var weekSummary = summarize(weekItems);
  var monthItems = reportDateMonthItems(range.year, range.month);
  var monthSummary = summarize(monthItems);
  var targetAmount = ownerCount() * 2000000;
  var startDate = parseDateText(range.start);
  var endDate = parseDateText(range.end);
  var endIncludesMonth = startDate.getFullYear() !== endDate.getFullYear() || startDate.getMonth() !== endDate.getMonth();
  var weekMap = {};
  groupByOwner(weekItems).forEach(function(group) { weekMap[group.owner] = group; });
  var monthGroups = groupByOwner(monthItems);
  var ownerLines = monthGroups
    .sort(function(a, b) {
      var amountDiff = b.summary.total.amount - a.summary.total.amount;
      if (amountDiff !== 0) return amountDiff;
      var weekAmountDiff = (weekMap[b.owner] ? weekMap[b.owner].summary.total.amount : 0) -
        (weekMap[a.owner] ? weekMap[a.owner].summary.total.amount : 0);
      if (weekAmountDiff !== 0) return weekAmountDiff;
      return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
    })
    .map(function(monthGroup) {
      var weekGroup = weekMap[monthGroup.owner] || { summary: summarize([]) };
      return [
        monthGroup.owner,
        "주간 " + reportWonMan(weekGroup.summary.total.amount),
        "(신규 " + weekGroup.summary.new.count + " / 증대 " + weekGroup.summary.growth.count + ")",
        "누적 " + reportWonMan(monthGroup.summary.total.amount) + " / " + percentText(monthGroup.summary.total.amount, 2000000),
        "(신규 " + monthGroup.summary.new.count + " / 증대 " + monthGroup.summary.growth.count + ")"
      ].join("\n");
    });

  return [
    "< 수도권팀 주간보고 >",
    "*" + koreanMonthDay(range.start, true) + " ~ " + koreanMonthDay(range.end, endIncludesMonth) + " (" + weekNumbersText(range.start, range.end) + ")",
    "",
    "주간 누적 신규 " + weekSummary.new.count + "건 / 증대 " + weekSummary.growth.count + "건",
    "누적 매출합 " + reportWonMan(weekSummary.total.amount) + " /",
    "",
    "——————————————————",
    String(range.month).padStart(2, "0") + "월 누적 매출",
    "",
    "팀 목표 : " + reportWonMan(targetAmount),
    "",
    "누적 신규 : " + monthSummary.new.count + "건 / 증대 : " + monthSummary.growth.count + "건",
    "누적매출 : " + reportWonMan(monthSummary.total.amount) + " / " + percentText(monthSummary.total.amount, targetAmount),
    "",
    "——————————————————",
    "담당자별 실적",
    "",
    ownerLines.join("\n\n")
  ].join("\n");
}
function updateWeeklyReportPreview() {
  if (!weeklyReportPreview) return;
  weeklyReportPreview.textContent = weeklyReportText();
}
function refreshWeeklyReportPreviewWithLeaves() {
  refreshWeeklyLeaveRows().then(updateWeeklyReportPreview).catch(function() {
    updateWeeklyReportPreview();
  });
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
function calendarStatusText(statusValue) {
  return statusValue === "workday" ? "근무일" : "휴일";
}
function renderHolidayList(message) {
  if (!holidayList) return;
  holidayList.textContent = "";

  if (message) {
    var loading = document.createElement("div");
    loading.className = "holiday-empty";
    loading.textContent = message;
    holidayList.appendChild(loading);
    return;
  }

  if (calendarLoadError) {
    var error = document.createElement("div");
    error.className = "holiday-empty";
    error.textContent = "목록을 불러오지 못했습니다. Supabase SQL 실행 여부를 확인해주세요.";
    holidayList.appendChild(error);
    return;
  }

  if (!teamCalendarDays.length) {
    var empty = document.createElement("div");
    empty.className = "holiday-empty";
    empty.textContent = "저장된 날짜가 없습니다.";
    holidayList.appendChild(empty);
    return;
  }

  teamCalendarDays.slice().sort(function(a, b) {
    return a.date.localeCompare(b.date);
  }).forEach(function(day) {
    var item = document.createElement("div");
    item.className = "holiday-item";

    var text = document.createElement("span");
    text.textContent = koreanDateShort(day.date) + " · " + calendarStatusText(day.status);
    var small = document.createElement("small");
    small.textContent = day.label || (day.status === "workday" ? "정상근무" : "휴일");
    text.appendChild(small);

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn";
    edit.textContent = "수정";
    edit.addEventListener("click", function() {
      setLeaveDateInput(holidayDateInput, day.date);
      if (holidayStatusInput) holidayStatusInput.value = day.status;
      if (holidayLabelInput) holidayLabelInput.value = day.label || "";
    });

    var del = document.createElement("button");
    del.type = "button";
    del.className = "btn danger";
    del.textContent = "삭제";
    del.addEventListener("click", function() {
      showNotice(koreanDateShort(day.date) + " 설정을 삭제합니다.", "danger", "삭제", function() {
        hideNotice();
        deleteCalendarDay(day.date).catch(function(error) {
          showNotice("설정 삭제 실패: " + error.message, "danger");
        });
      }, true);
    });

    item.appendChild(text);
    item.appendChild(edit);
    item.appendChild(del);
    holidayList.appendChild(item);
  });
}
async function openHolidayAdminModal() {
  setLeaveDateInput(holidayDateInput, selectedTeamDate || todayText);
  if (holidayStatusInput) holidayStatusInput.value = "holiday";
  if (holidayLabelInput) holidayLabelInput.value = "";
  renderHolidayList("목록을 불러오는 중입니다.");
  if (holidayOverlay) {
    holidayOverlay.classList.add("active");
    holidayOverlay.setAttribute("aria-hidden", "false");
  }
  await loadCalendarDays(true);
  renderHolidayList();
}
function closeHolidayAdminModal() {
  if (!holidayOverlay) return;
  holidayOverlay.classList.remove("active");
  holidayOverlay.setAttribute("aria-hidden", "true");
}
async function saveCalendarDay() {
  var date = leaveDateValue(holidayDateInput);
  var statusValue = holidayStatusInput ? holidayStatusInput.value : "holiday";
  var label = holidayLabelInput ? holidayLabelInput.value.trim() : "";
  if (!date) {
    showNotice("날짜를 선택해주세요.", "danger");
    return;
  }
  await holidayApi("POST", {
    date: date,
    status: statusValue,
    label: label || calendarStatusText(statusValue)
  });
  await loadCalendarDays(true);
  renderHolidayList();
  renderCalendar();
  render();
  showNotice("날짜 설정을 저장했습니다.");
}
async function deleteCalendarDay(date) {
  await holidayApi("DELETE", null, "?date=" + encodeURIComponent(date));
  await loadCalendarDays(true);
  renderHolidayList();
  renderCalendar();
  render();
  showNotice("날짜 설정을 삭제했습니다.");
}
function setAdminMenuOpen(open) {
  if (!adminMenu || !adminMenuBtn) return;
  adminMenu.classList.toggle("active", open);
  adminMenu.setAttribute("aria-hidden", open ? "false" : "true");
  adminMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
}
function closeAdminMenu() {
  setAdminMenuOpen(false);
}
function normalizeEventDays(event) {
  var days = Array.isArray(event && event.days) ? event.days.slice() : [];
  if (!days.length && event && event.date) {
    days = [{
      date: event.date,
      neededCount: event.neededCount || 2,
      attendees: event.attendees || []
    }];
  }
  return days.map(function(day) {
    return {
      date: day.date,
      neededCount: Number(day.neededCount || event.neededCount || 2),
      attendees: Array.isArray(day.attendees) ? day.attendees.filter(function(owner) {
        return ownerNames.indexOf(owner) >= 0;
      }) : []
    };
  }).filter(function(day) {
    return /^\d{4}-\d{2}-\d{2}$/.test(day.date);
  }).sort(function(a, b) {
    return a.date.localeCompare(b.date);
  });
}
function exhibitionDatesText(days) {
  if (!days.length) return "";
  if (days.length === 1) return koreanDateShort(days[0].date);
  return koreanDateShort(days[0].date) + "~" + koreanDateShort(days[days.length - 1].date);
}
function exhibitionOwnersText(owners) {
  return (owners || []).length ? owners.join(", ") : "미지정";
}
function exhibitionSelectedDates() {
  var dates = dateListFromSet(exhibitionDraftDateSet);
  if (dates.length) return dates;
  var start = leaveDateValue(exhibitionDateInput);
  if (!start) return [];
  var end = leaveDateValue(exhibitionEndDateInput) || start;
  return datesBetween(start < end ? start : end, end < start ? start : end);
}
function removeExhibitionDate(date) {
  delete exhibitionDraftDateSet[date];
  delete exhibitionDraftSelections[date];
  delete exhibitionDraftNeededCounts[date];
  var dates = dateListFromSet(exhibitionDraftDateSet);
  setLeaveDateInput(exhibitionDateInput, dates[0] || "");
  setLeaveDateInput(exhibitionEndDateInput, dates[dates.length - 1] || "");
  syncExhibitionDraftDates();
  renderExhibitionForm();
}
function setExhibitionNeededCountForDate(date, count) {
  exhibitionDraftNeededCounts[date] = Math.max(1, Math.min(ownerNames.length, Number(count) || 2));
  var selected = (exhibitionDraftSelections[date] || []).slice();
  var needed = exhibitionNeededCountForDate(date);
  if (selected.length > needed) {
    exhibitionDraftSelections[date] = selected.slice(0, needed);
  }
}
function syncExhibitionDraftDates() {
  var dates = exhibitionSelectedDates();
  var next = {};
  var nextNeededCounts = {};
  dates.forEach(function(date) {
    next[date] = (exhibitionDraftSelections[date] || []).filter(function(owner) {
      return ownerNames.indexOf(owner) >= 0;
    });
    nextNeededCounts[date] = Math.max(1, Math.min(ownerNames.length, Number(exhibitionDraftNeededCounts[date] || exhibitionNeededCountInput && exhibitionNeededCountInput.value || 2) || 2));
  });
  exhibitionDraftSelections = next;
  exhibitionDraftNeededCounts = nextNeededCounts;
}
function exhibitionNeededCountForDate(date) {
  return Math.max(1, Math.min(ownerNames.length, Number(exhibitionDraftNeededCounts[date] || 2) || 2));
}
function exhibitionDraftDays() {
  syncExhibitionDraftDates();
  return Object.keys(exhibitionDraftSelections).sort().map(function(date) {
    return {
      date: date,
      neededCount: exhibitionNeededCountForDate(date),
      attendees: exhibitionDraftSelections[date].slice()
    };
  });
}
function allEventAttendanceRows(skipEventId) {
  var rows = [];
  exhibitionEvents.forEach(function(event) {
    if (skipEventId && event.id === skipEventId) return;
    normalizeEventDays(event).forEach(function(day) {
      day.attendees.forEach(function(owner) {
        rows.push({ owner: owner, date: day.date, title: event.title || "" });
      });
    });
  });
  return rows;
}
function exhibitionStatsByOwner(skipEventId, draftExceptDate) {
  var stats = {};
  ownerNames.forEach(function(owner) {
    stats[owner] = { owner: owner, count: 0, lastDate: "" };
  });

  allEventAttendanceRows(skipEventId).forEach(function(row) {
    if (!stats[row.owner]) return;
    stats[row.owner].count += 1;
    if (!stats[row.owner].lastDate || row.date > stats[row.owner].lastDate) {
      stats[row.owner].lastDate = row.date;
    }
  });

  if (draftExceptDate) {
    Object.keys(exhibitionDraftSelections).forEach(function(date) {
      if (date === draftExceptDate) return;
      (exhibitionDraftSelections[date] || []).forEach(function(owner) {
        if (!stats[owner]) return;
        stats[owner].count += 1;
        if (!stats[owner].lastDate || date > stats[owner].lastDate) {
          stats[owner].lastDate = date;
        }
      });
    });
  }

  return stats;
}
function randomOwnerOrder() {
  return ownerNames.map(function(owner) {
    return { owner: owner, sort: Math.random() };
  }).sort(function(a, b) {
    return a.sort - b.sort;
  }).map(function(item) {
    return item.owner;
  });
}
function rerollExhibitionTieOrder() {
  exhibitionTieOrder = randomOwnerOrder();
}
function exhibitionTieRank(owner) {
  var index = exhibitionTieOrder.indexOf(owner);
  return index >= 0 ? index : ownerNames.indexOf(owner);
}
function exhibitionRecommendedOwnersForDate(date) {
  var needed = exhibitionNeededCountForDate(date);
  var stats = exhibitionStatsByOwner(exhibitionEditingId, date);
  if (!exhibitionTieOrder.length) rerollExhibitionTieOrder();
  return ownerNames.slice().sort(function(a, b) {
    var aStats = stats[a];
    var bStats = stats[b];
    var aNever = aStats.count === 0;
    var bNever = bStats.count === 0;
    if (aNever !== bNever) return aNever ? -1 : 1;
    if (aStats.lastDate !== bStats.lastDate) {
      if (!aStats.lastDate) return -1;
      if (!bStats.lastDate) return 1;
      return aStats.lastDate.localeCompare(bStats.lastDate);
    }
    if (aStats.count !== bStats.count) return aStats.count - bStats.count;
    return exhibitionTieRank(a) - exhibitionTieRank(b);
  }).slice(0, needed);
}
function renderExhibitionOwnerCheckboxes(parent, date, selectedOwners) {
  var selected = {};
  (selectedOwners || []).forEach(function(owner) {
    selected[owner] = true;
  });
  ownerNames.forEach(function(owner) {
    var label = document.createElement("label");
    label.className = "exhibition-check";

    var input = document.createElement("input");
    input.type = "checkbox";
    input.value = owner;
    input.checked = Boolean(selected[owner]);
    input.addEventListener("change", function() {
      var selectedOwners = Array.prototype.slice.call(parent.querySelectorAll("input:checked")).map(function(checked) {
        return checked.value;
      });
      var needed = exhibitionNeededCountForDate(date);
      if (selectedOwners.length > needed) {
        input.checked = false;
        showNotice(koreanDateShort(date) + " 참석자는 " + needed + "명까지 선택할 수 있습니다.", "danger");
        return;
      }
      exhibitionDraftSelections[date] = selectedOwners;
      renderExhibitionForm();
    });

    var span = document.createElement("span");
    span.textContent = owner;

    label.appendChild(input);
    label.appendChild(span);
    parent.appendChild(label);
  });
}
function renderExhibitionAttendees() {
  if (!exhibitionAttendees) return;
  syncExhibitionDraftDates();
  exhibitionAttendees.textContent = "";

  var dates = Object.keys(exhibitionDraftSelections).sort();
  if (!dates.length) {
    var empty = document.createElement("div");
    empty.className = "exhibition-empty";
    empty.textContent = "기간 선택 버튼을 눌러 전시회 날짜를 선택해주세요.";
    exhibitionAttendees.appendChild(empty);
    return;
  }

  dates.forEach(function(date) {
    var dayCard = document.createElement("div");
    dayCard.className = "exhibition-day-card";

    var head = document.createElement("div");
    head.className = "exhibition-day-head";
    var title = document.createElement("strong");
    title.textContent = koreanDateShort(date);
    var removeDateBtn = document.createElement("button");
    removeDateBtn.type = "button";
    removeDateBtn.className = "btn";
    removeDateBtn.textContent = "날짜 삭제";
    removeDateBtn.addEventListener("click", function(selectedDate) {
      return function() {
        removeExhibitionDate(selectedDate);
      };
    }(date));
    var tools = document.createElement("div");
    tools.className = "exhibition-day-tools";
    var selectedCount = document.createElement("span");
    selectedCount.textContent = "선택 " + (exhibitionDraftSelections[date] || []).length + "명 / " + exhibitionNeededCountForDate(date) + "명";
    var neededSelect = document.createElement("select");
    neededSelect.className = "exhibition-needed-select";
    for (var countIndex = 1; countIndex <= ownerNames.length; countIndex += 1) {
      var option = document.createElement("option");
      option.value = String(countIndex);
      option.textContent = countIndex + "명";
      if (countIndex === exhibitionNeededCountForDate(date)) option.selected = true;
      neededSelect.appendChild(option);
    }
    neededSelect.addEventListener("change", function(selectedDate) {
      return function(e) {
        setExhibitionNeededCountForDate(selectedDate, e.target.value);
        renderExhibitionForm();
      };
    }(date));
    tools.appendChild(selectedCount);
    tools.appendChild(neededSelect);
    head.appendChild(title);
    head.appendChild(removeDateBtn);

    var rec = document.createElement("div");
    rec.className = "exhibition-recommendation";
    var recHead = document.createElement("div");
    recHead.className = "exhibition-rec-head";
    var recTitle = document.createElement("strong");
    recTitle.textContent = "추천 참석자";
    var apply = document.createElement("button");
    apply.type = "button";
    apply.className = "btn";
    apply.textContent = "추천 적용";
    apply.addEventListener("click", function() {
      exhibitionDraftSelections[date] = exhibitionRecommendedOwnersForDate(date);
      renderExhibitionForm();
    });
    recHead.appendChild(recTitle);
    recHead.appendChild(apply);
    rec.appendChild(recHead);

    var recList = document.createElement("div");
    recList.className = "exhibition-rec-list";
    var stats = exhibitionStatsByOwner(exhibitionEditingId, date);
    exhibitionRecommendedOwnersForDate(date).forEach(function(owner) {
      var chip = document.createElement("span");
      chip.className = "exhibition-rec-chip";
      chip.textContent = owner;
      var small = document.createElement("small");
      small.textContent = stats[owner].count ? "최근 " + koreanDateShort(stats[owner].lastDate) + " · " + stats[owner].count + "회" : "기록 없음";
      chip.appendChild(small);
      recList.appendChild(chip);
    });
    rec.appendChild(recList);

    var grid = document.createElement("div");
    grid.className = "exhibition-attendee-grid";
    renderExhibitionOwnerCheckboxes(grid, date, exhibitionDraftSelections[date] || []);

    dayCard.appendChild(head);
    dayCard.appendChild(tools);
    dayCard.appendChild(rec);
    dayCard.appendChild(grid);
    exhibitionAttendees.appendChild(dayCard);
  });
}
function renderExhibitionStats() {
  if (!exhibitionOwnerStats) return;
  exhibitionOwnerStats.textContent = "";
  var stats = exhibitionStatsByOwner("");
  ownerNames.slice().sort(function(a, b) {
    var aStats = stats[a];
    var bStats = stats[b];
    if (aStats.count !== bStats.count) return aStats.count - bStats.count;
    if (aStats.lastDate !== bStats.lastDate) {
      if (!aStats.lastDate) return -1;
      if (!bStats.lastDate) return 1;
      return aStats.lastDate.localeCompare(bStats.lastDate);
    }
    return ownerNames.indexOf(a) - ownerNames.indexOf(b);
  }).forEach(function(owner) {
    var row = document.createElement("div");
    var active = selectedExhibitionStatsOwner === owner;
    row.className = "exhibition-stat-card" + (active ? " active" : "");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-pressed", active ? "true" : "false");
    var top = document.createElement("div");
    top.className = "exhibition-stat-top";
    var name = document.createElement("strong");
    name.textContent = owner;
    var count = document.createElement("b");
    count.className = "exhibition-stat-count";
    count.textContent = stats[owner].count + "회";
    var recent = document.createElement("span");
    recent.className = "exhibition-stat-recent";
    recent.textContent = stats[owner].lastDate ? "최근 " + koreanDateShort(stats[owner].lastDate) : "참석 없음";
    top.appendChild(name);
    top.appendChild(count);
    row.appendChild(top);
    row.appendChild(recent);
    row.addEventListener("click", function() {
      selectedExhibitionStatsOwner = selectedExhibitionStatsOwner === owner ? "" : owner;
      renderExhibitionStats();
    });
    row.addEventListener("keydown", function(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      selectedExhibitionStatsOwner = selectedExhibitionStatsOwner === owner ? "" : owner;
      renderExhibitionStats();
    });
    if (active) {
      var eventHistory = exhibitionOwnerEventHistory(owner);
      appendExhibitionEventHistory(row, eventHistory);
    }
    exhibitionOwnerStats.appendChild(row);
  });
}
function setExhibitionFormVisible(visible) {
  exhibitionFormVisible = Boolean(visible);
  if (exhibitionWorkspace) exhibitionWorkspace.classList.toggle("form-closed", !exhibitionFormVisible);
  if (exhibitionEditor) exhibitionEditor.classList.toggle("collapsed", !exhibitionFormVisible);
  if (exhibitionActions) exhibitionActions.classList.toggle("collapsed", !exhibitionFormVisible);
  if (exhibitionFormToggleBtn) {
    exhibitionFormToggleBtn.textContent = exhibitionFormVisible ? "입력 접기" : "행사 입력";
    exhibitionFormToggleBtn.classList.toggle("primary", !exhibitionFormVisible);
  }
}
function renderExhibitionForm() {
  updateExhibitionRangeStatus();
  renderExhibitionAttendees();
  renderExhibitionStats();
  if (exhibitionSaveBtn) exhibitionSaveBtn.textContent = exhibitionEditingId ? "수정 저장" : "저장";
}
function resetExhibitionForm() {
  exhibitionEditingId = "";
  rerollExhibitionTieOrder();
  setLeaveDateInput(exhibitionDateInput, "");
  setLeaveDateInput(exhibitionEndDateInput, "");
  exhibitionDraftSelections = {};
  exhibitionDraftNeededCounts = {};
  exhibitionDraftDateSet = {};
  exhibitionCalendarDateSet = {};
  if (exhibitionNameInput) exhibitionNameInput.value = "";
  if (exhibitionNeededCountInput) exhibitionNeededCountInput.value = "2";
  if (exhibitionMemoInput) exhibitionMemoInput.value = "";
  syncExhibitionDraftDates();
  renderExhibitionForm();
  renderExhibitionList();
}
function exhibitionEventById(id) {
  return exhibitionEvents.find(function(event) {
    return event.id === id;
  }) || null;
}
function exhibitionOwnerHistory(owner) {
  var rows = [];
  exhibitionEvents.forEach(function(event) {
    normalizeEventDays(event).forEach(function(day) {
      if (day.attendees.indexOf(owner) < 0) return;
      rows.push({
        eventId: event.id,
        title: event.title || "전시회",
        date: day.date
      });
    });
  });
  return rows.sort(function(a, b) {
    return b.date.localeCompare(a.date) || b.title.localeCompare(a.title);
  });
}
function exhibitionDateSpanTextFromList(dates) {
  var list = (dates || []).slice().sort();
  if (!list.length) return "";
  if (list.length === 1) return koreanDateShort(list[0]);
  return koreanDateShort(list[0]) + "~" + koreanDateShort(list[list.length - 1]);
}
function exhibitionOwnerEventHistory(owner) {
  var map = {};
  exhibitionEvents.forEach(function(event) {
    normalizeEventDays(event).forEach(function(day) {
      if (day.attendees.indexOf(owner) < 0) return;
      if (!map[event.id]) {
        map[event.id] = {
          id: event.id,
          title: event.title || "전시회",
          dates: []
        };
      }
      map[event.id].dates.push(day.date);
    });
  });
  return Object.keys(map).map(function(id) {
    var item = map[id];
    item.dates = item.dates.slice().sort();
    item.lastDate = item.dates[item.dates.length - 1] || "";
    return item;
  }).sort(function(a, b) {
    return b.lastDate.localeCompare(a.lastDate) || a.title.localeCompare(b.title);
  });
}
function exhibitionOwnerDaysInEvent(event, owner) {
  return normalizeEventDays(event).filter(function(day) {
    return day.attendees.indexOf(owner) >= 0;
  }).map(function(day) {
    return day.date;
  });
}
function appendOwnerInfoRow(parent, label, value) {
  var row = document.createElement("div");
  row.className = "exhibition-owner-info-row";
  var key = document.createElement("b");
  key.textContent = label;
  var val = document.createElement("span");
  val.textContent = value;
  row.appendChild(key);
  row.appendChild(val);
  parent.appendChild(row);
}
function appendExhibitionEventHistory(parent, eventHistory, emptyText) {
  var history = document.createElement("div");
  history.className = "exhibition-stat-history";
  history.addEventListener("click", function(e) {
    e.stopPropagation();
  });
  if (!eventHistory.length) {
    var empty = document.createElement("span");
    empty.className = "exhibition-stat-history-empty";
    empty.textContent = emptyText || "참석 기록이 없습니다.";
    history.appendChild(empty);
  } else {
    eventHistory.forEach(function(item) {
      var historyRow = document.createElement("button");
      historyRow.type = "button";
      historyRow.className = "exhibition-history-row";
      historyRow.addEventListener("click", function(e) {
        e.stopPropagation();
        openExhibitionDetail(item.id);
      });
      var eventTitle = document.createElement("b");
      eventTitle.textContent = item.title;
      var eventDates = document.createElement("span");
      eventDates.textContent = exhibitionDateSpanTextFromList(item.dates);
      historyRow.appendChild(eventTitle);
      historyRow.appendChild(eventDates);
      history.appendChild(historyRow);
    });
  }
  parent.appendChild(history);
}
function renderExhibitionDetailOwnerInfo(event, owner) {
  if (!exhibitionDetailOwnerInfo) return;
  exhibitionDetailOwnerInfo.textContent = "";
  if (!owner) {
    exhibitionDetailOwnerInfo.textContent = "이름을 누르면 최근 참석 기록을 볼 수 있습니다.";
    return;
  }

  var title = document.createElement("strong");
  title.textContent = owner + " 참석 기록";
  exhibitionDetailOwnerInfo.appendChild(title);

  var history = exhibitionOwnerHistory(owner);
  appendOwnerInfoRow(exhibitionDetailOwnerInfo, "최근", history.length ? koreanDateShort(history[0].date) + " · " + history[0].title : "참석 없음");
  appendOwnerInfoRow(exhibitionDetailOwnerInfo, "누적", history.length + "회");
  appendExhibitionEventHistory(exhibitionDetailOwnerInfo, exhibitionOwnerEventHistory(owner));
}
function renderExhibitionDetail() {
  var event = exhibitionEventById(currentExhibitionDetailId);
  if (!event) {
    closeExhibitionDetail();
    return;
  }

  var days = normalizeEventDays(event);
  var totalNeeded = days.reduce(function(sum, day) {
    return sum + Number(day.neededCount || 0);
  }, 0);
  var totalAttendees = days.reduce(function(sum, day) {
    return sum + day.attendees.length;
  }, 0);

  if (exhibitionDetailTitle) exhibitionDetailTitle.textContent = event.title || "전시회";
  if (exhibitionDetailMeta) {
    exhibitionDetailMeta.textContent = exhibitionDatesText(days) + " · " + days.length + "일 · 참석 " + totalAttendees + "/" + totalNeeded + "명";
  }

  if (exhibitionDetailDays) {
    exhibitionDetailDays.textContent = "";
    days.forEach(function(day) {
      var row = document.createElement("div");
      row.className = "exhibition-detail-day-row";
      var dateCell = document.createElement("div");
      dateCell.className = "exhibition-detail-date";
      var date = document.createElement("strong");
      date.textContent = koreanDateShort(day.date);
      var needed = document.createElement("small");
      needed.textContent = day.neededCount + "명";
      dateCell.appendChild(date);
      dateCell.appendChild(needed);
      var owners = document.createElement("div");
      owners.className = "exhibition-detail-attendees";
      if (day.attendees.length) {
        day.attendees.forEach(function(owner) {
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "exhibition-detail-owner-chip" + (selectedExhibitionDetailOwner === owner ? " active" : "");
          chip.textContent = owner;
          chip.addEventListener("click", function() {
            selectedExhibitionDetailOwner = selectedExhibitionDetailOwner === owner ? "" : owner;
            renderExhibitionDetail();
          });
          owners.appendChild(chip);
        });
      } else {
        var empty = document.createElement("span");
        empty.className = "exhibition-detail-empty-name";
        empty.textContent = "미지정";
        owners.appendChild(empty);
      }
      row.appendChild(dateCell);
      row.appendChild(owners);
      exhibitionDetailDays.appendChild(row);
    });
  }

  if (exhibitionDetailOwners) {
    exhibitionDetailOwners.textContent = "";
    ownerNames.forEach(function(owner) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "exhibition-detail-owner" + (selectedExhibitionDetailOwner === owner ? " active" : "");

      var name = document.createElement("strong");
      name.textContent = owner;
      var eventDays = exhibitionOwnerDaysInEvent(event, owner);
      var current = document.createElement("small");
      current.textContent = eventDays.length ? "참석 " + eventDays.map(koreanDateShort).join(", ") : "미참석";
      var history = exhibitionOwnerHistory(owner);
      var recent = document.createElement("small");
      recent.textContent = history.length ? "최근 " + koreanDateShort(history[0].date) + " · " + history.length + "회" : "참석 없음";

      button.appendChild(name);
      button.appendChild(current);
      button.appendChild(recent);
      button.addEventListener("click", function() {
        selectedExhibitionDetailOwner = selectedExhibitionDetailOwner === owner ? "" : owner;
        renderExhibitionDetail();
      });
      exhibitionDetailOwners.appendChild(button);
    });
  }

  renderExhibitionDetailOwnerInfo(event, selectedExhibitionDetailOwner);
}
function openExhibitionDetail(eventOrId) {
  var event = typeof eventOrId === "string" ? exhibitionEventById(eventOrId) : eventOrId;
  if (!event || !exhibitionDetailOverlay) return;
  currentExhibitionDetailId = event.id;
  selectedExhibitionDetailOwner = "";
  renderExhibitionDetail();
  exhibitionDetailOverlay.classList.add("active");
  exhibitionDetailOverlay.setAttribute("aria-hidden", "false");
}
function closeExhibitionDetail() {
  currentExhibitionDetailId = "";
  selectedExhibitionDetailOwner = "";
  if (!exhibitionDetailOverlay) return;
  exhibitionDetailOverlay.classList.remove("active");
  exhibitionDetailOverlay.setAttribute("aria-hidden", "true");
}
function renderExhibitionList(message) {
  if (!exhibitionList) return;
  exhibitionList.textContent = "";

  if (message) {
    var loading = document.createElement("div");
    loading.className = "exhibition-empty";
    loading.textContent = message;
    exhibitionList.appendChild(loading);
    return;
  }

  if (exhibitionLoadError) {
    var error = document.createElement("div");
    error.className = "exhibition-empty";
    error.textContent = "목록을 불러오지 못했습니다. 전시회 SQL 실행 여부를 확인해주세요.";
    exhibitionList.appendChild(error);
    return;
  }

  if (!exhibitionEvents.length) {
    var empty = document.createElement("div");
    empty.className = "exhibition-empty";
    empty.textContent = "저장된 전시회가 없습니다.";
    exhibitionList.appendChild(empty);
    return;
  }

  exhibitionEvents.slice().sort(function(a, b) {
    return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
  }).forEach(function(event) {
    var item = document.createElement("div");
    item.className = "exhibition-item"
      + (event.id === exhibitionEditingId ? " editing" : "");

    var text = document.createElement("span");
    var title = document.createElement("span");
    title.className = "exhibition-item-title";
    title.textContent = event.title || "전시회";
    text.appendChild(title);
    var detail = document.createElement("small");
    var days = normalizeEventDays(event);
    var totalNeeded = days.reduce(function(sum, day) { return sum + Number(day.neededCount || 0); }, 0);
    var totalAttendees = days.reduce(function(sum, day) { return sum + day.attendees.length; }, 0);
    detail.textContent = exhibitionDatesText(days) + " · " + days.length + "일 · 참석 " + totalAttendees + "/" + totalNeeded + "명";
    text.appendChild(detail);

    var edit = document.createElement("button");
    edit.type = "button";
    edit.className = "btn";
    edit.textContent = event.id === exhibitionEditingId ? "수정 중" : "수정";
    edit.addEventListener("click", function(e) {
      e.stopPropagation();
      if (exhibitionEditingId === event.id) {
        resetExhibitionForm();
        setExhibitionFormVisible(false);
        return;
      }
      startEditExhibition(event);
    });

    var del = document.createElement("button");
    del.type = "button";
    del.className = "btn danger";
    del.textContent = "삭제";
    del.addEventListener("click", function(e) {
      e.stopPropagation();
      showNotice((event.title || "전시회") + " 기록을 삭제합니다.", "danger", "삭제", function() {
        hideNotice();
        deleteExhibitionEvent(event.id).catch(function(error) {
          showNotice("전시회 삭제 실패: " + error.message, "danger");
        });
      }, true);
    });
    item.addEventListener("click", function() {
      openExhibitionDetail(event);
    });

    item.appendChild(text);
    item.appendChild(edit);
    item.appendChild(del);
    exhibitionList.appendChild(item);
  });
}
function startEditExhibition(event) {
  exhibitionEditingId = event.id;
  setExhibitionFormVisible(true);
  var days = normalizeEventDays(event);
  setExhibitionDates(days.map(function(day) { return day.date; }));
  if (exhibitionNameInput) exhibitionNameInput.value = event.title || "";
  if (exhibitionNeededCountInput) exhibitionNeededCountInput.value = String(event.neededCount || Math.max(1, (event.attendees || []).length) || 2);
  if (exhibitionMemoInput) exhibitionMemoInput.value = event.memo || "";
  exhibitionDraftSelections = {};
  exhibitionDraftNeededCounts = {};
  days.forEach(function(day) {
    exhibitionDraftSelections[day.date] = day.attendees || [];
    exhibitionDraftNeededCounts[day.date] = Number(day.neededCount || event.neededCount || 2);
  });
  syncExhibitionDraftDates();
  renderExhibitionForm();
  renderExhibitionList();
}
async function openExhibitionModal() {
  if (exhibitionOverlay) {
    exhibitionOverlay.classList.add("active");
    exhibitionOverlay.setAttribute("aria-hidden", "false");
  }
  selectedExhibitionStatsOwner = "";
  setExhibitionFormVisible(false);
  rerollExhibitionTieOrder();
  syncExhibitionDraftDates();
  renderExhibitionForm();
  renderExhibitionList("목록을 불러오는 중입니다.");
  await loadExhibitions();
}
function closeExhibitionModal() {
  if (!exhibitionOverlay) return;
  closeExhibitionDetail();
  exhibitionOverlay.classList.remove("active");
  exhibitionOverlay.setAttribute("aria-hidden", "true");
}
async function saveExhibitionEvent() {
  var date = leaveDateValue(exhibitionDateInput);
  var title = exhibitionNameInput ? exhibitionNameInput.value.trim() : "";
  var days = exhibitionDraftDays();
  if (!date) {
    showNotice("전시회 기간을 선택해주세요.", "danger");
    return;
  }
  if (!title) {
    showNotice("행사명을 입력해주세요.", "danger");
    if (exhibitionNameInput) exhibitionNameInput.focus();
    return;
  }
  if (!days.length) {
    showNotice("전시회 날짜를 한 개 이상 선택해주세요.", "danger");
    return;
  }
  if (!days.some(function(day) { return day.attendees.length; })) {
    showNotice("날짜별 참석자를 한 명 이상 선택해주세요.", "danger");
    return;
  }

  var saved = await exhibitionApi("POST", {
    id: exhibitionEditingId,
    date: days[0].date,
    title: title,
    neededCount: days[0].neededCount || 2,
    days: days,
    memo: exhibitionMemoInput ? exhibitionMemoInput.value.trim() : ""
  });

  var found = false;
  exhibitionEvents = exhibitionEvents.map(function(event) {
    if (event.id === saved.id) {
      found = true;
      return saved;
    }
    return event;
  });
  if (!found) exhibitionEvents.unshift(saved);
  resetExhibitionForm();
  setExhibitionFormVisible(false);
  renderExhibitionList();
  showNotice("전시회 참석 기록을 저장했습니다.");
}
async function deleteExhibitionEvent(id) {
  await exhibitionApi("DELETE", null, "?id=" + encodeURIComponent(id));
  exhibitionEvents = exhibitionEvents.filter(function(event) {
    return event.id !== id;
  });
  var wasEditing = exhibitionEditingId === id;
  if (wasEditing) {
    resetExhibitionForm();
    setExhibitionFormVisible(false);
  }
  if (currentExhibitionDetailId === id) closeExhibitionDetail();
  renderExhibitionForm();
  renderExhibitionList();
  showNotice("전시회 기록을 삭제했습니다.");
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
  card.className = "report-card " + typeClass(item.type) + (openedReportId === item.id ? " open" : "");
  card.dataset.reportId = item.id;
  card.addEventListener("click", function() {
    openedReportId = openedReportId === item.id ? "" : item.id;
    render();
  });

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
  info.textContent = item.date + " · " + productShortLabel(item.product);

  var bottom = document.createElement("div");
  bottom.className = "report-bottom";
  var bottomLeft = document.createElement("div");
  bottomLeft.className = "report-bottom-left";
  var badge = document.createElement("span");
  badge.className = "badge " + typeClass(item.type);
  badge.textContent = item.type;
  var prescriptionState = document.createElement("span");
  prescriptionState.className = "prescription-state " + (item.prescriptionDone ? "done" : "pending");
  prescriptionState.textContent = item.prescriptionDone ? "통계입력 완료" : "미완료";
  bottomLeft.appendChild(badge);
  bottomLeft.appendChild(prescriptionState);

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
  bottom.appendChild(bottomLeft);
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
function renderOwnerSearchResults() {
  if (!ownerSearchResults) return;
  var term = currentOwnerSearchTerm();
  ownerSearchResults.textContent = "";
  ownerSearchResults.classList.toggle("active", !!term);
  if (!term) return;

  var scopeOwner = ownerSearchScopeOwner();
  if (!scopeOwner) {
    var needOwner = document.createElement("div");
    needOwner.className = "empty";
    needOwner.textContent = "담당자 이름을 선택하거나 담당자 카드를 연 뒤 검색해주세요.";
    ownerSearchResults.appendChild(needOwner);
    return;
  }
  var results = reports
    .filter(function(item) {
      if (ownerNames.indexOf(item.owner) < 0) return false;
      if (item.owner !== scopeOwner) return false;
      return matchesOwnerSearch(item, term);
    })
    .slice()
    .sort(function(a, b) {
      var dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateDiff !== 0) return dateDiff;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

  var head = document.createElement("div");
  head.className = "owner-search-head";
  var scope = document.createElement("span");
  scope.textContent = scopeOwner + " · 전체 기간 검색";
  var count = document.createElement("span");
  count.textContent = results.length + "건";
  head.appendChild(scope);
  head.appendChild(count);
  ownerSearchResults.appendChild(head);

  if (!results.length) {
    var empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "검색 결과가 없습니다.";
    ownerSearchResults.appendChild(empty);
    return;
  }

  results.slice(0, 30).forEach(function(item) {
    var row = document.createElement("button");
    row.type = "button";
    row.className = "owner-search-row";
    row.addEventListener("click", function() {
      selectedYear = collectionYearOf(item);
      selectedMonth = collectionMonthOf(item);
      openedOwner = item.owner;
      openedReportId = item.id;
      committedOwnerSearchTerm = "";
      if (ownerSearchInput) ownerSearchInput.value = "";
      syncMonthPicker();
      render();
      scrollOpenedOwnerIntoView(ownerCards, item.owner);
    });

    var main = document.createElement("div");
    main.className = "owner-search-main";
    var client = document.createElement("div");
    client.className = "owner-search-client";
    client.textContent = item.client;
    main.appendChild(client);
    if (item.branchName) {
      var branch = document.createElement("div");
      branch.className = "owner-search-branch";
      branch.textContent = item.branchName;
      main.appendChild(branch);
    }

    var meta = document.createElement("div");
    meta.className = "owner-search-meta";
    [item.owner, item.date, "수거 " + collectionText(item), item.type, productShortLabel(item.product)].forEach(function(text) {
      var span = document.createElement("span");
      span.textContent = text;
      meta.appendChild(span);
    });
    main.appendChild(meta);

    var amount = document.createElement("div");
    amount.className = "owner-search-amount";
    amount.textContent = won(item.amount);
    row.appendChild(main);
    row.appendChild(amount);
    ownerSearchResults.appendChild(row);
  });

  if (results.length > 30) {
    var more = document.createElement("div");
    more.className = "owner-search-head";
    more.textContent = "최근 30건만 표시합니다.";
    ownerSearchResults.appendChild(more);
  }
}
function renderOwnerCards(items) {
  ownerCards.textContent = "";
  var searchTerm = currentOwnerSearchTerm();
  renderOwnerSearchResults();

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
    card.dataset.owner = group.owner;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "owner-button" + (openedOwner === group.owner ? " active" : "");
    button.addEventListener("click", function() {
      var willOpen = openedOwner !== group.owner;
      openedOwner = willOpen ? group.owner : "";
      openedReportId = "";
      render();
      if (willOpen) scrollOpenedOwnerIntoView(ownerCards, group.owner);
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

    var detail = document.createElement("div");
    detail.className = "detail-list";

    var filterType = ownerFilters[group.owner];
    group.items
      .filter(function(item) { return !filterType || item.type === filterType; })
      .filter(function(item) { return matchesOwnerSearch(item, searchTerm); })
      .slice()
      .sort(function(a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); })
      .forEach(function(item, index) {
        detail.appendChild(reportCard(item, index));
      });

    if (!detail.children.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = searchTerm ? "검색 결과가 없습니다." : "해당 구분의 거래처가 없습니다.";
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
    card.dataset.owner = group.owner;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "owner-button" + (openedTeamOwner === group.owner ? " active" : "");
    button.addEventListener("click", function() {
      var willOpen = openedTeamOwner !== group.owner;
      openedTeamOwner = willOpen ? group.owner : "";
      openedReportId = "";
      render();
      if (willOpen) scrollOpenedOwnerIntoView(todayOwnerCards, group.owner);
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

function scrollOpenedOwnerIntoView(container, owner) {
  if (!container || !owner) return;
  setTimeout(function() {
    var card = container.querySelector('[data-owner="' + owner + '"]');
    if (card) {
      var header = document.querySelector("header");
      var headerHeight = header ? header.getBoundingClientRect().height : 0;
      var top = card.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, 0);
}
function openSuccessCaseModal(item) {
  successCaseEditingId = item.id;
  if (successCaseClient) successCaseClient.textContent = item.owner + " · " + item.client;
  if (successCaseText) successCaseText.value = item.successCase || "";
  if (successCaseOverlay) {
    successCaseOverlay.classList.add("active");
    successCaseOverlay.setAttribute("aria-hidden", "false");
  }
  setTimeout(function() {
    if (successCaseText) successCaseText.focus();
  }, 0);
}
function closeSuccessCaseModal() {
  successCaseEditingId = "";
  if (!successCaseOverlay) return;
  successCaseOverlay.classList.remove("active");
  successCaseOverlay.setAttribute("aria-hidden", "true");
}
async function saveSuccessCase() {
  var item = reports.find(function(report) { return report.id === successCaseEditingId; });
  if (!item) {
    showNotice("성공사례를 저장할 거래처를 찾지 못했습니다.", "danger");
    return;
  }
  var actor = ownerInput.value.trim() || localStorage.getItem("ownerName") || item.owner || "";
  var next = Object.assign({}, item, {
    successCase: successCaseText ? successCaseText.value.trim() : "",
    updatedAt: Date.now(),
    actor: actor
  });
  var saved = await api("PUT", next);
  reports = reports.map(function(report) {
    return report.id === saved.id ? saved : report;
  });
  closeSuccessCaseModal();
  render();
  showNotice("성공사례를 저장했습니다.");
}
function productSummary(items) {
  var rows = [
    { key: "oralChlor", product: "경구제+클로르", count: 0, amount: 0 },
    { key: "oral", product: "경구제", count: 0, amount: 0 },
    { key: "chlor", product: "클로르", count: 0, amount: 0 }
  ];
  var map = rows.reduce(function(result, row) {
    result[row.key] = row;
    return result;
  }, {});
  items.forEach(function(item) {
    var info = productComboInfo(item.product);
    if (!map[info.key]) return;
    map[info.key].count += 1;
    map[info.key].amount += Number(item.amount || 0);
  });
  return rows;
}
function renderMeetingCards(items) {
  if (!meetingCards) return;
  meetingCards.textContent = "";
  if (meetingMonthLabel) meetingMonthLabel.textContent = "회의자료 기준 월";

  var groups = groupByOwner(items).sort(function(a, b) {
    var amountDiff = b.summary.total.amount - a.summary.total.amount;
    if (amountDiff !== 0) return amountDiff;
    return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
  });
  if (selectedMeetingOwner && ownerNames.indexOf(selectedMeetingOwner) < 0) selectedMeetingOwner = "";

  if (!selectedMeetingOwner) {
    meetingCards.className = "meeting-grid meeting-list";
    groups.forEach(function(group) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "meeting-owner-card meeting-owner-button";
      card.addEventListener("click", function() {
        selectedMeetingOwner = group.owner;
        renderMeetingCards(items);
        setTimeout(function() {
          var panel = document.getElementById("meetingPanel");
          var header = document.querySelector("header");
          var headerHeight = header ? header.getBoundingClientRect().height : 0;
          if (panel) {
            window.scrollTo({
              top: Math.max(0, panel.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8),
              behavior: "smooth"
            });
          }
        }, 0);
      });

      var head = document.createElement("div");
      head.className = "meeting-owner-head";
      var name = document.createElement("strong");
      name.textContent = group.owner;
      var rate = document.createElement("span");
      rate.className = "meeting-rate";
      rate.textContent = ownerAchievementRate(group.summary.total.amount) + "%";
      head.appendChild(name);
      head.appendChild(rate);

      var total = document.createElement("div");
      total.className = "meeting-total";
      total.textContent = won(group.summary.total.amount);

      var counts = document.createElement("div");
      counts.className = "meeting-counts";
      counts.textContent = "신규 " + group.summary.new.count + "건 · 증대 " + group.summary.growth.count + "건";

      card.appendChild(head);
      card.appendChild(total);
      card.appendChild(counts);
      meetingCards.appendChild(card);
    });
    return;
  }

  meetingCards.className = "meeting-grid meeting-slide-mode";
  var group = groups.find(function(row) { return row.owner === selectedMeetingOwner; }) || groupByOwner([]).find(function(row) { return row.owner === selectedMeetingOwner; });
  var slide = document.createElement("div");
  slide.className = "meeting-slide";

  var slideHead = document.createElement("div");
  slideHead.className = "meeting-slide-head";
  var title = document.createElement("div");
  var eyebrow = document.createElement("span");
  eyebrow.className = "meeting-eyebrow";
  eyebrow.textContent = "MR 수도권팀 개인별 회의자료";
  var name = document.createElement("h3");
  name.textContent = group.owner;
  title.appendChild(eyebrow);
  title.appendChild(name);
  var back = document.createElement("button");
  back.type = "button";
  back.className = "btn";
  back.textContent = "목록으로";
  back.addEventListener("click", function() {
    selectedMeetingOwner = "";
    renderMeetingCards(items);
  });
  var present = document.createElement("button");
  present.type = "button";
  present.className = "btn primary";
  present.textContent = "크게 보기";
  present.addEventListener("click", function() {
    openMeetingPresentation(group);
  });
  var controls = document.createElement("div");
  controls.className = "meeting-slide-controls";
  controls.appendChild(back);
  controls.appendChild(present);
  slideHead.appendChild(title);
  slideHead.appendChild(controls);

  var kpis = document.createElement("div");
  kpis.className = "meeting-slide-kpis";
  [
    { label: "월 누적", value: won(group.summary.total.amount), note: ownerAchievementRate(group.summary.total.amount) + "%" },
    { label: "신규", value: won(group.summary.new.amount), note: group.summary.new.count + "건" },
    { label: "매출증대", value: won(group.summary.growth.amount), note: group.summary.growth.count + "건" }
  ].forEach(function(row) {
    var kpi = document.createElement("div");
    kpi.className = "meeting-kpi";
    var label = document.createElement("span");
    label.textContent = row.label;
    var value = document.createElement("strong");
    value.textContent = row.value;
    var note = document.createElement("small");
    note.textContent = row.note;
    kpi.appendChild(label);
    kpi.appendChild(value);
    kpi.appendChild(note);
    kpis.appendChild(kpi);
  });

  var productBox = document.createElement("div");
  productBox.className = "meeting-section";
  var productTitle = document.createElement("h4");
  productTitle.textContent = "품목군 요약";
  var productGrid = document.createElement("div");
  productGrid.className = "meeting-product-grid";
  productSummary(group.items).forEach(function(row) {
    var item = document.createElement("div");
    item.className = "meeting-product-item";
    item.innerHTML = "<span></span><strong></strong>";
    item.querySelector("span").textContent = row.product + " · " + row.count + "건";
    item.querySelector("strong").textContent = won(row.amount);
    productGrid.appendChild(item);
  });
  productBox.appendChild(productTitle);
  productBox.appendChild(productGrid);

  var caseBox = document.createElement("div");
  caseBox.className = "meeting-section";
  var caseTitle = document.createElement("h4");
  caseTitle.textContent = "성공사례";
  var caseList = document.createElement("div");
  caseList.className = "meeting-case-list";
  var caseItems = group.items.filter(function(item) { return item.successCase; });
  if (caseItems.length) {
    caseItems.forEach(function(item) {
      var line = document.createElement("div");
      line.className = "meeting-case-item";
      var client = document.createElement("strong");
      client.textContent = item.client;
      var text = document.createElement("span");
      text.textContent = item.successCase;
      line.appendChild(client);
      line.appendChild(text);
      caseList.appendChild(line);
    });
  } else {
    var emptyCase = document.createElement("div");
    emptyCase.className = "meeting-empty-line";
    emptyCase.textContent = "작성된 성공사례가 없습니다.";
    caseList.appendChild(emptyCase);
  }
  caseBox.appendChild(caseTitle);
  caseBox.appendChild(caseList);

  var clientBox = document.createElement("div");
  clientBox.className = "meeting-section";
  var clientTitle = document.createElement("h4");
  clientTitle.textContent = "전체 거래처";
  var clientList = document.createElement("div");
  clientList.className = "meeting-client-list";
  group.items
    .slice()
    .sort(function(a, b) { return Number(b.amount || 0) - Number(a.amount || 0); })
    .forEach(function(item) {
      var row = document.createElement("div");
      row.className = "meeting-client-item " + typeClass(item.type);
      var left = document.createElement("div");
      var client = document.createElement("strong");
      client.textContent = item.client;
      var info = document.createElement("small");
      info.className = "client-meta";
      var typeLabel = document.createElement("span");
      typeLabel.className = "client-type-label " + typeClass(item.type);
      typeLabel.textContent = item.type;
      var productLabel = document.createElement("span");
      productLabel.textContent = productShortLabel(item.product);
      var dateLabel = document.createElement("span");
      dateLabel.textContent = item.date;
      info.appendChild(typeLabel);
      info.appendChild(productLabel);
      info.appendChild(dateLabel);
      left.appendChild(client);
      left.appendChild(info);
      var side = document.createElement("div");
      side.className = "meeting-client-side";
      var amount = document.createElement("b");
      amount.textContent = won(item.amount);
      var caseBtn = document.createElement("button");
      caseBtn.type = "button";
      caseBtn.className = "btn meeting-case-btn";
      caseBtn.textContent = item.successCase ? "사례수정" : "성공사례 작성";
      caseBtn.addEventListener("click", function() {
        openSuccessCaseModal(item);
      });
      side.appendChild(amount);
      side.appendChild(caseBtn);
      row.appendChild(left);
      row.appendChild(side);
      clientList.appendChild(row);
    });
  if (!clientList.children.length) {
    var emptyClient = document.createElement("div");
    emptyClient.className = "meeting-empty-line";
    emptyClient.textContent = "등록된 거래처가 없습니다.";
    clientList.appendChild(emptyClient);
  }
  clientBox.appendChild(clientTitle);
  clientBox.appendChild(clientList);

  slide.appendChild(slideHead);
  slide.appendChild(kpis);
  slide.appendChild(productBox);
  slide.appendChild(caseBox);
  slide.appendChild(clientBox);
  meetingCards.appendChild(slide);
}

function appendPresentationMetric(parent, label, value, note, extraClass) {
  var item = document.createElement("div");
  item.className = "presentation-metric" + (extraClass ? " " + extraClass : "");
  var labelEl = document.createElement("span");
  labelEl.textContent = label;
  var valueEl = document.createElement("strong");
  valueEl.textContent = value;
  var noteEl = document.createElement("small");
  noteEl.textContent = note;
  item.appendChild(labelEl);
  item.appendChild(valueEl);
  item.appendChild(noteEl);
  parent.appendChild(item);
}
function openMeetingPresentation(group) {
  var overlay = document.createElement("div");
  overlay.className = "presentation-overlay active";
  var stage = document.createElement("div");
  stage.className = "presentation-stage";

  var close = document.createElement("button");
  close.type = "button";
  close.className = "presentation-close";
  close.textContent = "닫기";
  close.addEventListener("click", function() {
    overlay.remove();
  });

  var head = document.createElement("div");
  head.className = "presentation-head";
  var title = document.createElement("div");
  var eyebrow = document.createElement("span");
  eyebrow.textContent = selectedYear + "년 " + selectedMonth + "월";
  var name = document.createElement("h2");
  name.textContent = group.owner;
  title.appendChild(eyebrow);
  title.appendChild(name);
  var rateValue = ownerAchievementRate(group.summary.total.amount);
  var totalCard = document.createElement("div");
  totalCard.className = "presentation-total-card";
  var totalLabel = document.createElement("span");
  totalLabel.textContent = "월 총 매출";
  var totalValue = document.createElement("strong");
  totalValue.textContent = wonMan(group.summary.total.amount);
  var goalLine = document.createElement("small");
  goalLine.textContent = "목표 200만원 · 목표대비 " + rateValue + "%";
  var progress = document.createElement("div");
  progress.className = "presentation-progress";
  var progressBar = document.createElement("i");
  progressBar.style.width = Math.min(100, Math.max(0, rateValue)) + "%";
  progress.appendChild(progressBar);
  totalCard.appendChild(totalLabel);
  totalCard.appendChild(totalValue);
  totalCard.appendChild(goalLine);
  totalCard.appendChild(progress);
  head.appendChild(title);
  head.appendChild(totalCard);

  var sortedByAmount = group.items
    .slice()
    .sort(function(a, b) { return Number(b.amount || 0) - Number(a.amount || 0); });
  var topClient = sortedByAmount[0] || null;
  var caseItems = group.items.filter(function(item) { return item.successCase; });
  var firstCase = caseItems[0] || null;
  var metrics = document.createElement("div");
  metrics.className = "presentation-metrics";
  appendPresentationMetric(metrics, "신규", group.summary.new.count + "건", wonMan(group.summary.new.amount), "count-focus");
  appendPresentationMetric(metrics, "증대", group.summary.growth.count + "건", wonMan(group.summary.growth.amount), "count-sub");
  appendPresentationMetric(metrics, "최대 거래처", topClient ? topClient.client : "-", topClient ? wonMan(topClient.amount) : "0원", "client-focus");
  appendPresentationMetric(metrics, "성공사례", firstCase ? firstCase.client : "-", firstCase ? "작성 완료" : "미작성", "client-focus");

  var body = document.createElement("div");
  body.className = "presentation-body";
  var products = document.createElement("div");
  products.className = "presentation-section presentation-products";
  var productTitle = document.createElement("h3");
  productTitle.textContent = "품목별 요약";
  products.appendChild(productTitle);
  productSummary(group.items).forEach(function(row) {
    var line = document.createElement("div");
    line.className = "presentation-line presentation-product-line";
    var left = document.createElement("span");
    left.textContent = row.product + " · " + row.count + "건";
    var right = document.createElement("strong");
    right.textContent = won(row.amount);
    line.appendChild(left);
    line.appendChild(right);
    products.appendChild(line);
  });

  var cases = document.createElement("div");
  cases.className = "presentation-section presentation-cases";
  var caseTitle = document.createElement("h3");
  caseTitle.textContent = "성공사례";
  cases.appendChild(caseTitle);
  if (caseItems.length) {
    caseItems.forEach(function(item) {
      var line = document.createElement("div");
      line.className = "presentation-case";
      var client = document.createElement("strong");
      client.textContent = item.client;
      var text = document.createElement("span");
      text.textContent = item.successCase;
      line.appendChild(client);
      line.appendChild(text);
      cases.appendChild(line);
    });
  } else {
    var empty = document.createElement("div");
    empty.className = "presentation-empty";
    empty.textContent = "작성된 성공사례가 없습니다.";
    cases.appendChild(empty);
  }

  var clients = document.createElement("div");
  clients.className = "presentation-section presentation-clients";
  var clientHead = document.createElement("div");
  clientHead.className = "presentation-section-head";
  var clientsTitle = document.createElement("h3");
  clientsTitle.textContent = "전체 거래처";
  var pageInfo = document.createElement("span");
  pageInfo.className = "presentation-page-info";
  clientHead.appendChild(clientsTitle);
  clientHead.appendChild(pageInfo);
  var clientRows = document.createElement("div");
  clientRows.className = "presentation-client-page";
  var pageControls = document.createElement("div");
  pageControls.className = "presentation-page-controls";
  var prevPage = document.createElement("button");
  prevPage.type = "button";
  prevPage.className = "btn";
  prevPage.textContent = "이전 페이지";
  var nextPage = document.createElement("button");
  nextPage.type = "button";
  nextPage.className = "btn primary";
  nextPage.textContent = "다음 페이지";
  pageControls.appendChild(prevPage);
  pageControls.appendChild(nextPage);
  clients.appendChild(clientHead);
  clients.appendChild(clientRows);
  clients.appendChild(pageControls);

  var allClients = group.items
    .slice()
    .sort(function(a, b) { return Number(b.amount || 0) - Number(a.amount || 0); });
  var pageSize = window.innerWidth <= 900 ? 5 : 7;
  var clientPage = 0;
  function renderClientPage() {
    clientRows.textContent = "";
    var totalPages = Math.max(1, Math.ceil(allClients.length / pageSize));
    if (clientPage >= totalPages) clientPage = totalPages - 1;
    if (clientPage < 0) clientPage = 0;
    pageInfo.textContent = allClients.length ? (clientPage + 1) + " / " + totalPages + "페이지 · " + allClients.length + "건" : "0건";
    allClients.slice(clientPage * pageSize, clientPage * pageSize + pageSize).forEach(function(item) {
      var line = document.createElement("div");
      line.className = "presentation-line";
      var left = document.createElement("div");
      left.className = "presentation-client-main";
      var clientName = document.createElement("strong");
      clientName.className = "presentation-client-name";
      clientName.textContent = item.client;
      var clientMeta = document.createElement("span");
      clientMeta.className = "client-meta presentation-client-meta";
      var typeLabel = document.createElement("span");
      typeLabel.className = "client-type-label " + typeClass(item.type);
      typeLabel.textContent = item.type;
      var productLabel = document.createElement("span");
      productLabel.textContent = productShortLabel(item.product);
      clientMeta.appendChild(typeLabel);
      clientMeta.appendChild(productLabel);
      left.appendChild(clientName);
      left.appendChild(clientMeta);
      var right = document.createElement("strong");
      right.className = "presentation-client-amount";
      right.textContent = won(item.amount);
      line.appendChild(left);
      line.appendChild(right);
      clientRows.appendChild(line);
    });
    if (!clientRows.children.length) {
      var emptyClient = document.createElement("div");
      emptyClient.className = "presentation-empty";
      emptyClient.textContent = "등록된 거래처가 없습니다.";
      clientRows.appendChild(emptyClient);
    }
    pageControls.style.display = totalPages > 1 ? "grid" : "none";
    prevPage.disabled = clientPage <= 0;
    nextPage.disabled = clientPage >= totalPages - 1;
  }
  prevPage.addEventListener("click", function() {
    clientPage -= 1;
    renderClientPage();
  });
  nextPage.addEventListener("click", function() {
    clientPage += 1;
    renderClientPage();
  });
  renderClientPage();

  body.appendChild(products);
  body.appendChild(cases);
  body.appendChild(clients);
  stage.appendChild(close);
  stage.appendChild(head);
  stage.appendChild(metrics);
  stage.appendChild(body);
  overlay.appendChild(stage);
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
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
        isBusinessDate(parseDateText(item.date));
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
  renderMeetingCards(items);

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
  setProductList([]);
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
  setProductList([]);
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
  productInput.value = item.product || "";
  updateProductSelectionSummary();
  renderProductOptions();
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
  document.body.classList.remove("view-meeting");
  document.querySelectorAll("[data-view]").forEach(function(tab) {
    tab.classList.toggle("active", tab.dataset.view === "form");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

syncCollectionButtons();
syncTeamPeriodControls();
updateProductSelectionSummary();
renderProductOptions();

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
if (productChooseBtn) {
  productChooseBtn.addEventListener("click", openProductModal);
}
if (productDoneBtn) {
  productDoneBtn.addEventListener("click", closeProductModal);
}
if (productClearBtn) {
  productClearBtn.addEventListener("click", function() {
    setProductList([]);
  });
}
if (productOverlay) {
  productOverlay.addEventListener("click", function(e) {
    if (e.target === productOverlay) closeProductModal();
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
if (holidayDateInput) {
  holidayDateInput.addEventListener("click", function() {
    openCalendar("holidayDate", leaveDateValue(holidayDateInput) || selectedTeamDate || todayText);
  });
}
if (holidaySaveBtn) {
  holidaySaveBtn.addEventListener("click", function() {
    saveCalendarDay().catch(function(error) {
      showNotice("날짜 설정 저장 실패: " + error.message, "danger");
    });
  });
}
if (holidayCloseBtn) {
  holidayCloseBtn.addEventListener("click", closeHolidayAdminModal);
}
if (holidayOverlay) {
  holidayOverlay.addEventListener("click", function(e) {
    if (e.target === holidayOverlay) closeHolidayAdminModal();
  });
}
if (exhibitionDateInput) {
  exhibitionDateInput.addEventListener("click", function() {
    openCalendar("exhibitionDate", leaveDateValue(exhibitionDateInput) || todayText);
  });
}
if (exhibitionEndDateInput) {
  exhibitionEndDateInput.addEventListener("click", function() {
    openCalendar("exhibitionEndDate", leaveDateValue(exhibitionEndDateInput) || leaveDateValue(exhibitionDateInput) || todayText);
  });
}
if (exhibitionRangeBtn) {
  exhibitionRangeBtn.addEventListener("click", function() {
    openCalendar("exhibitionRange", leaveDateValue(exhibitionDateInput) || todayText);
  });
}
if (exhibitionNeededCountInput) {
  exhibitionNeededCountInput.addEventListener("change", renderExhibitionForm);
}
if (exhibitionFormToggleBtn) {
  exhibitionFormToggleBtn.addEventListener("click", function() {
    setExhibitionFormVisible(!exhibitionFormVisible);
  });
}
if (exhibitionSaveBtn) {
  exhibitionSaveBtn.addEventListener("click", function() {
    saveExhibitionEvent().catch(function(error) {
      showNotice("전시회 저장 실패: " + exhibitionErrorMessage(error), "danger");
    });
  });
}
if (exhibitionResetBtn) {
  exhibitionResetBtn.addEventListener("click", resetExhibitionForm);
}
if (exhibitionCloseBtn) {
  exhibitionCloseBtn.addEventListener("click", closeExhibitionModal);
}
if (exhibitionOverlay) {
  exhibitionOverlay.addEventListener("click", function(e) {
    if (e.target === exhibitionOverlay) closeExhibitionModal();
  });
}
if (exhibitionDetailCloseBtn) {
  exhibitionDetailCloseBtn.addEventListener("click", closeExhibitionDetail);
}
if (exhibitionDetailOverlay) {
  exhibitionDetailOverlay.addEventListener("click", function(e) {
    if (e.target === exhibitionDetailOverlay) closeExhibitionDetail();
  });
}
if (appTitle) {
  var titlePressTimer = null;
  var titlePressFired = false;
  var cancelTitlePress = function() {
    if (titlePressTimer) clearTimeout(titlePressTimer);
    titlePressTimer = null;
  };
  appTitle.addEventListener("pointerdown", function() {
    titlePressFired = false;
    cancelTitlePress();
    titlePressTimer = setTimeout(function() {
      titlePressFired = true;
      openHolidayAdminModal().catch(function(error) {
        showNotice("휴일 설정 열기 실패: " + error.message, "danger");
      });
    }, 2000);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function(eventName) {
    appTitle.addEventListener(eventName, cancelTitlePress);
  });
  appTitle.addEventListener("click", function(e) {
    if (titlePressFired) e.preventDefault();
  });
}
if (adminMenuBtn) {
  adminMenuBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    setAdminMenuOpen(!(adminMenu && adminMenu.classList.contains("active")));
  });
}
if (menuHolidayBtn) {
  menuHolidayBtn.addEventListener("click", function() {
    closeAdminMenu();
    openHolidayAdminModal().catch(function(error) {
      showNotice("휴일 설정 열기 실패: " + error.message, "danger");
    });
  });
}
if (menuExhibitionBtn) {
  menuExhibitionBtn.addEventListener("click", function() {
    closeAdminMenu();
    openExhibitionModal().catch(function(error) {
      showNotice("전시회 참석 열기 실패: " + error.message, "danger");
    });
  });
}
document.addEventListener("click", function(e) {
  if (!adminMenu || !adminMenu.classList.contains("active")) return;
  if (e.target && e.target.closest && e.target.closest(".admin-menu-wrap")) return;
  closeAdminMenu();
});
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
if (successCaseSaveBtn) {
  successCaseSaveBtn.addEventListener("click", function() {
    saveSuccessCase().catch(function(error) {
      showNotice("성공사례 저장 실패: " + error.message, "danger");
    });
  });
}
if (successCaseCloseBtn) {
  successCaseCloseBtn.addEventListener("click", closeSuccessCaseModal);
}
if (successCaseOverlay) {
  successCaseOverlay.addEventListener("click", function(e) {
    if (e.target === successCaseOverlay) closeSuccessCaseModal();
  });
}
ownerInput.addEventListener("change", function() {
  var owner = ownerInput.value.trim();
  if (ownerNames.indexOf(owner) >= 0) {
    localStorage.setItem("ownerName", owner);
  }
  renderCompletionPanel();
  render();
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
if (meetingPrevMonthBtn) {
  meetingPrevMonthBtn.addEventListener("click", function() { moveMonth(-1); });
}
if (meetingNextMonthBtn) {
  meetingNextMonthBtn.addEventListener("click", function() { moveMonth(1); });
}
if (meetingCurrentMonthBtn) {
  meetingCurrentMonthBtn.addEventListener("click", resetToCurrentMonth);
}
document.getElementById("cancelEditBtn").addEventListener("click", resetFormAll);
document.querySelectorAll("[data-view]").forEach(function(button) {
  button.addEventListener("click", function() {
    var view = button.dataset.view;
    document.body.classList.toggle("view-form", view === "form");
    document.body.classList.toggle("view-dashboard", view === "dashboard");
    document.body.classList.toggle("view-today", view === "today");
    document.body.classList.toggle("view-meeting", view === "meeting");
    document.querySelectorAll("[data-view]").forEach(function(tab) {
      tab.classList.toggle("active", tab.dataset.view === view);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
if (ownerSearchInput) {
  ownerSearchInput.addEventListener("input", function() {
    clearCommittedOwnerSearch();
  });
  ownerSearchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitOwnerSearch();
    }
    if (e.key === "Escape") {
      ownerSearchInput.value = "";
      clearCommittedOwnerSearch();
    }
  });
}
if (ownerSearchButton) {
  ownerSearchButton.addEventListener("click", submitOwnerSearch);
}
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
    var nextDate = teamDatePicker.value || todayText;
    if (isNonWorkingDateText(nextDate)) {
      showNotice("휴일에는 일일현황을 조회할 수 없습니다. 다른 날짜를 선택해주세요.", "danger");
      teamDatePicker.value = selectedTeamDate;
      return;
    }
    selectedTeamDate = nextDate;
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
    setSelectedWeekByDate(teamWeekPicker.value || todayText);
    setDefaultWeeklyReportRange();
    openedTeamOwner = "";
    render();
  });
}
if (teamWeekLabel) {
  teamWeekLabel.addEventListener("click", function() {
    openCalendar("week", selectedWeekAnchorText());
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
if (calendarConfirmBtn) {
  calendarConfirmBtn.addEventListener("click", function() {
    if (calendarMode === "exhibitionRange") {
      confirmExhibitionDateSelection();
    }
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
  moveSelectedWeek(-1);
});
document.getElementById("nextWeekBtn").addEventListener("click", function() {
  moveSelectedWeek(1);
});
monthPicker.addEventListener("change", function() {
  setSelectedMonthFromValue(monthPicker.value);
});
if (meetingMonthPicker) {
  meetingMonthPicker.addEventListener("change", function() {
    setSelectedMonthFromValue(meetingMonthPicker.value);
  });
}

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
    if (productChooseBtn) productChooseBtn.focus();
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
  if (isNonWorkingDateText(reportDate)) {
    showNotice("휴일에는 거래처 입력이 불가능합니다. 다른 날짜를 선택해주세요.", "danger");
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
    product: productInput.value.trim(),
    amount: amountWon(amountInput.value),
    collectionYear: collectionYear,
    collectionMonth: collectionMonth,
    prescriptionDone: Boolean(old.prescriptionDone),
    successCase: old.successCase || ""
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


