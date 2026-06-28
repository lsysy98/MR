var money = new Intl.NumberFormat("ko-KR");
var today = new Date();
var todayText = dateText(today);
var currentYear = today.getFullYear();
var currentMonth = today.getMonth() + 1;
var selectedYear = currentYear;
var selectedMonth = currentMonth;
var reports = [];
var selectedType = "신규";
var openedOwner = "";
var ownerFilters = {};
var editingId = "";

var form = document.getElementById("reportForm");
var ownerInput = document.getElementById("owner");
var dateInput = document.getElementById("date");
var clientInput = document.getElementById("client");
var productInput = document.getElementById("product");
var amountInput = document.getElementById("amount");
var amountPreview = document.getElementById("amountPreview");
var ownerCards = document.getElementById("ownerCards");
var statusBox = document.getElementById("statusBox");
var monthPicker = document.getElementById("monthPicker");

dateInput.value = todayText;
ownerInput.value = localStorage.getItem("ownerName") || "";

function dateText(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
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
function monthOf(x) {
  return x.date ? Number(String(x.date).slice(5, 7)) : currentMonth;
}
function yearOf(x) {
  return x.date ? Number(String(x.date).slice(0, 4)) : currentYear;
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
function selectedMonthLabel() {
  return selectedYear + "년 " + selectedMonth + "월";
}
function moveMonth(delta) {
  var d = new Date(selectedYear, selectedMonth - 1 + delta, 1);
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth() + 1;
  openedOwner = "";
  syncMonthPicker();
  render();
}
function resetToCurrentMonth() {
  selectedYear = currentYear;
  selectedMonth = currentMonth;
  openedOwner = "";
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
    return yearOf(item) === selectedYear && monthOf(item) === selectedMonth;
  });
}
function groupByOwner(items) {
  var map = {};
  items.forEach(function(item) {
    var owner = item.owner || "담당자 없음";
    if (!map[owner]) map[owner] = [];
    map[owner].push(item);
  });
  return Object.keys(map).sort().map(function(owner) {
    return { owner: owner, items: map[owner], summary: summarize(map[owner]) };
  });
}

function prescriptionButton(item) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn " + (item.prescriptionDone ? "done" : "pending");
  button.textContent = item.prescriptionDone ? "처방입력 완료" : "처방입력 미완료";
  button.addEventListener("click", function(e) {
    e.stopPropagation();
    togglePrescription(item).catch(function(error) {
      status("처방입력 변경 실패: " + error.message, "error");
      toast(error.message);
    });
  });
  return button;
}
function reportCard(item) {
  var card = document.createElement("div");
  card.className = "report-card";

  var top = document.createElement("div");
  top.className = "report-top";
  var client = document.createElement("div");
  client.className = "client";
  client.textContent = item.client;
  var info = document.createElement("div");
  info.className = "report-info";
  info.textContent = item.date + " · " + item.product + " · " + won(item.amount);
  top.appendChild(client);
  top.appendChild(info);

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

  card.appendChild(top);
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
  small.textContent = sub + " · 누르면 해당 거래처만 보기";

  button.appendChild(span);
  button.appendChild(strong);
  button.appendChild(small);
  parent.appendChild(button);
}
function renderOwnerCards(items) {
  ownerCards.textContent = "";

  groupByOwner(items).forEach(function(group) {
    var summary = group.summary;
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
    line.textContent = "신규 " + summary.new.count + "건  증대 " + summary.growth.count + "건  " + won(summary.total.amount);
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
      .forEach(function(item) {
        detail.appendChild(reportCard(item));
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
function render() {
  var items = monthlyItems();
  var summary = summarize(items);
  var doneRate = summary.total.count ? Math.round(summary.done / summary.total.count * 100) : 0;

  document.getElementById("monthLabel").textContent = selectedMonthLabel();
  syncMonthPicker();
  document.getElementById("totalAmount").textContent = won(summary.total.amount);
  document.getElementById("totalCount").textContent = summary.total.count + "건";
  document.getElementById("newAmount").textContent = won(summary.new.amount);
  document.getElementById("newCount").textContent = summary.new.count + "건";
  document.getElementById("growthAmount").textContent = won(summary.growth.amount);
  document.getElementById("growthCount").textContent = summary.growth.count + "건";
  document.getElementById("doneRate").textContent = doneRate + "%";
  document.getElementById("doneCount").textContent = summary.done + " / " + summary.total.count + "건";
  document.getElementById("empty").style.display = items.length ? "none" : "block";
  renderOwnerCards(items);
}
function resetAfterSave() {
  editingId = "";
  clientInput.value = "";
  productInput.value = "";
  amountInput.value = "";
  selectedType = "신규";
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "저장";
  clientInput.focus();
}
function resetFormAll() {
  editingId = "";
  clientInput.value = "";
  productInput.value = "";
  amountInput.value = "";
  dateInput.value = todayText;
  selectedType = "신규";
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
  updateTypeButtons();
  updateAmountPreview();
  document.getElementById("submitBtn").textContent = "수정 저장";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
document.getElementById("prevMonthBtn").addEventListener("click", function() { moveMonth(-1); });
document.getElementById("nextMonthBtn").addEventListener("click", function() { moveMonth(1); });
document.getElementById("currentMonthBtn").addEventListener("click", resetToCurrentMonth);
document.getElementById("cancelEditBtn").addEventListener("click", resetFormAll);
document.getElementById("stickySubmitBtn").addEventListener("click", function() { form.requestSubmit(); });
monthPicker.addEventListener("change", function() {
  if (!monthPicker.value) return;
  var parts = monthPicker.value.split("-");
  selectedYear = Number(parts[0]);
  selectedMonth = Number(parts[1]);
  openedOwner = "";
  render();
});

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  var owner = ownerInput.value.trim();
  if (!owner) {
    toast("담당자 이름을 입력해주세요.");
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
