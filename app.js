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

dateInput.value = todayText;
if (teamDatePicker) teamDatePicker.value = selectedTeamDate;
if (teamWeekPicker) teamWeekPicker.value = selectedWeekStart;
var savedOwnerName = localStorage.getItem("ownerName") || "";
ownerInput.value = ownerNames.indexOf(savedOwnerName) >= 0 ? savedOwnerName : "";
productInput.value = "클로르";

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
function dayLabel(value) {
  var d = parseDateText(value);
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  return d.getFullYear() + ". " +
    String(d.getMonth() + 1).padStart(2, "0") + ". " +
    String(d.getDate()).padStart(2, "0") + ". " +
    days[d.getDay()];
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
function typeClass(type) {
  return type === "신규" ? "new" : "growth";
}
function status(message, type) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = "status " + (type || "");
}
function toast(msg) {
  var box = document.getElementById("toast");
  box.textContent = msg;
  setTimeout(function() { box.textContent = ""; }, 2200);
}
function updateAmountPreview() {
  var man = amountMan(amountInput.value);
  amountPreview.textContent = man ? money.format(man) + "만원 = " + won(man * 10000) : "1 입력 = 10,000원";
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

async function api(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  var response = await fetch("/api/reports" + (query || ""), options);
  var data = await response.json().catch(function() { return {}; });
  if (!response.ok) throw new Error(data.error || "요청 실패");
  return data;
}
async function loadData() {
  status("Supabase 저장소와 연결 확인 중입니다.", "");
  reports = await api("GET");
  status("연결 성공: 저장된 보고 " + reports.length + "건을 불러왔습니다.", "ok");
  render();
}
async function addData(item) {
  var saved = await api("POST", item);
  reports.unshift(saved);
  render();
  toast("저장되었습니다.");
}
async function updateData(item) {
  var saved = await api("PUT", item);
  reports = reports.map(function(report) {
    return report.id === saved.id ? saved : report;
  });
  render();
  toast("수정되었습니다.");
}
async function deleteData(id) {
  if (!confirm("이 보고를 삭제할까요?")) return;
  await api("DELETE", null, "?id=" + encodeURIComponent(id));
  reports = reports.filter(function(report) {
    return report.id !== id;
  });
  render();
  toast("삭제되었습니다.");
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
  var end = addDays(start, 6);
  return { start: dateText(start), end: dateText(end) };
}
function teamPeriodItems() {
  var range = weekRange();
  return reports.filter(function(item) {
    if (ownerNames.indexOf(item.owner) < 0) return false;
    if (selectedTeamPeriod === "week") {
      return item.date >= range.start && item.date <= range.end;
    }
    return item.date === selectedTeamDate;
  });
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
  button.textContent = item.prescriptionDone ? "처방완료" : "미완료";
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
  var client = document.createElement("div");
  client.className = "client";
  client.textContent = item.client;
  var amount = document.createElement("div");
  amount.className = "report-amount";
  amount.textContent = won(item.amount);
  top.appendChild(client);
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

  groupByOwner(items).sort(function(a, b) {
    var amountDiff = b.summary.total.amount - a.summary.total.amount;
    if (amountDiff !== 0) return amountDiff;
    return ownerNames.indexOf(a.owner) - ownerNames.indexOf(b.owner);
  }).forEach(function(group) {
    var summary = group.summary;
    var card = document.createElement("div");
    card.className = "owner-card" + (openedTeamOwner === group.owner ? " open" : "");

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

    button.appendChild(name);
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
function render() {
  var items = monthlyItems();
  var teamItems = teamPeriodItems();
  var summary = summarize(items);
  var teamSummary = summarize(teamItems);
  var targetAmount = ownerCount() * 2000000;
  var achievementRate = targetAmount ? Math.round(summary.total.amount / targetAmount * 100) : 0;

  syncMonthPicker();
  syncTeamPeriodControls();
  document.getElementById("totalAmount").textContent = won(summary.total.amount);
  document.getElementById("totalCount").textContent = summary.total.count + "건";
  document.getElementById("newAmount").textContent = won(summary.new.amount);
  document.getElementById("newCount").textContent = summary.new.count + "건";
  document.getElementById("growthAmount").textContent = won(summary.growth.amount);
  document.getElementById("growthCount").textContent = summary.growth.count + "건";
  document.getElementById("doneRate").textContent = achievementRate + "%";
  document.getElementById("doneCount").textContent = "총매출 " + won(summary.total.amount) + " / 목표 " + won(targetAmount);
  document.getElementById("empty").style.display = items.length ? "none" : "block";
  renderOwnerCards(items);

  document.getElementById("todayTotalAmount").textContent = won(teamSummary.total.amount);
  document.getElementById("todayTotalCount").textContent = teamSummary.total.count + "건";
  document.getElementById("todayNewAmount").textContent = won(teamSummary.new.amount);
  document.getElementById("todayNewCount").textContent = teamSummary.new.count + "건";
  document.getElementById("todayGrowthAmount").textContent = won(teamSummary.growth.amount);
  document.getElementById("todayGrowthCount").textContent = teamSummary.growth.count + "건";
  if (todayEmpty) {
    todayEmpty.textContent = selectedTeamPeriod === "week" ? "선택한 주의 보고가 없습니다." : "선택한 날짜의 보고가 없습니다.";
    todayEmpty.style.display = teamItems.length ? "none" : "block";
  }
  renderTeamCards(teamItems);
}
function resetAfterSave() {
  editingId = "";
  clientInput.value = "";
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
  productInput.value = "클로르";
  amountInput.value = "";
  dateInput.value = todayText;
  selectedType = "신규";
  setDefaultCollectionMonth();
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "저장";
}
function startEdit(item) {
  editingId = item.id;
  ownerInput.value = item.owner;
  dateInput.value = item.date;
  clientInput.value = item.client;
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
    render();
  });
});
if (teamDatePicker) {
  teamDatePicker.addEventListener("change", function() {
    selectedTeamDate = teamDatePicker.value || todayText;
    openedTeamOwner = "";
    render();
  });
}
document.getElementById("prevDayBtn").addEventListener("click", function() {
  selectedTeamDate = dateText(addDays(parseDateText(selectedTeamDate), -1));
  openedTeamOwner = "";
  render();
});
document.getElementById("nextDayBtn").addEventListener("click", function() {
  selectedTeamDate = dateText(addDays(parseDateText(selectedTeamDate), 1));
  openedTeamOwner = "";
  render();
});
if (teamWeekPicker) {
  teamWeekPicker.addEventListener("change", function() {
    selectedWeekStart = dateText(startOfWeekDate(parseDateText(teamWeekPicker.value || todayText)));
    openedTeamOwner = "";
    render();
  });
}
document.getElementById("prevWeekBtn").addEventListener("click", function() {
  selectedWeekStart = dateText(addDays(parseDateText(selectedWeekStart), -7));
  openedTeamOwner = "";
  render();
});
document.getElementById("nextWeekBtn").addEventListener("click", function() {
  selectedWeekStart = dateText(addDays(parseDateText(selectedWeekStart), 7));
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

  var old = reports.find(function(report) { return report.id === editingId; }) || {};
  var item = {
    id: editingId || makeId(),
    createdAt: old.createdAt || Date.now(),
    updatedAt: Date.now(),
    date: dateInput.value,
    owner: owner,
    client: clientInput.value.trim(),
    type: selectedType,
    product: productInput.value,
    amount: amountWon(amountInput.value),
    collectionYear: collectionYear,
    collectionMonth: collectionMonth,
    prescriptionDone: Boolean(old.prescriptionDone)
  };

  try {
    var wasEditing = Boolean(editingId);
    if (wasEditing) await updateData(item);
    else await addData(item);
    resetAfterSave();
  } catch (error) {
    status("저장 실패: " + error.message, "error");
    toast(error.message);
  }
});

syncMonthPicker();
updateAmountPreview();
loadData().catch(function(error) {
  status("연결 실패: " + error.message, "error");
});
