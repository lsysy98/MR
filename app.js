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
var editingId = "";

var form = document.getElementById("reportForm");
var ownerInput = document.getElementById("owner");
var dateInput = document.getElementById("date");
var clientInput = document.getElementById("client");
var productInput = document.getElementById("product");
var amountInput = document.getElementById("amount");
var amountPreview = document.getElementById("amountPreview");
var ownerCards = document.getElementById("ownerCards");
var rows = document.getElementById("rows");
var statusBox = document.getElementById("statusBox");
var products = ["3제+클로르", "3제", "클로르"];

dateInput.value = todayText;
ownerInput.value = localStorage.getItem("ownerName") || "";

function dateText(d) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}
function makeId() { return Date.now() + "-" + Math.random().toString(16).slice(2); }
function digits(v) { return String(v || "").replace(/[^\d]/g, ""); }
function amountMan(v) { return Number(digits(v) || 0); }
function amountWon(v) { return amountMan(v) * 10000; }
function won(v) { var n = Number(v || 0); return n ? money.format(n) + "원" : "0원"; }
function monthOf(x) { return x.date ? Number(String(x.date).slice(5, 7)) : currentMonth; }
function yearOf(x) { return x.date ? Number(String(x.date).slice(0, 4)) : currentYear; }
function typeClass(type) { return type === "신규" ? "new" : "growth"; }
function status(message, type) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = "status " + (type || "");
}
function toast(msg) {
  var box = document.getElementById("toast");
  box.textContent = msg;
  setTimeout(function(){ box.textContent = ""; }, 2200);
}
function updateAmountPreview() {
  var man = amountMan(amountInput.value);
  amountPreview.textContent = man ? money.format(man) + "만원 = " + won(man * 10000) : "1 입력 = 10,000원";
}
function selectedMonthLabel() { return selectedYear + "년 " + selectedMonth + "월"; }
function moveMonth(delta) {
  var d = new Date(selectedYear, selectedMonth - 1 + delta, 1);
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth() + 1;
  openedOwner = "";
  render();
}
function resetToCurrentMonth() {
  selectedYear = currentYear;
  selectedMonth = currentMonth;
  openedOwner = "";
  render();
}

async function api(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  var response = await fetch("/api/reports" + (query || ""), options);
  var data = await response.json().catch(function(){ return {}; });
  if (!response.ok) throw new Error(data.error || "요청 실패");
  return data;
}
async function loadData() {
  status("Supabase 저장창고와 연결 확인 중입니다.", "");
  reports = await api("GET");
  status("연결 성공: 저장된 보고 " + reports.length + "건을 불러왔습니다.", "ok");
  render();
}
async function addData(item) {
  status("저장 중입니다.", "");
  await api("POST", item);
  await loadData();
  toast("저장되었습니다.");
}
async function updateData(item) {
  status("수정 중입니다.", "");
  await api("PUT", item);
  await loadData();
  toast("수정되었습니다.");
}
async function deleteData(id) {
  if (!confirm("삭제할까요?")) return;
  await api("DELETE", null, "?id=" + encodeURIComponent(id));
  await loadData();
  toast("삭제되었습니다.");
}
async function togglePrescription(item) {
  var next = Object.assign({}, item, {
    prescriptionDone: !item.prescriptionDone,
    updatedAt: Date.now()
  });
  await api("PUT", next);
  await loadData();
  toast(next.prescriptionDone ? "처방입력 완료로 표시했습니다." : "처방입력 미완료로 표시했습니다.");
}

function monthItems() {
  return reports.filter(function(x) {
    return yearOf(x) === selectedYear && monthOf(x) === selectedMonth;
  });
}
function blankProductMap() {
  var map = {};
  products.forEach(function(name){ map[name] = { count: 0, amount: 0 }; });
  return map;
}
function summarize(items) {
  return items.reduce(function(acc, item) {
    var amount = Number(item.amount || 0);
    acc.total.count += 1;
    acc.total.amount += amount;
    if (item.prescriptionDone) acc.done += 1;

    var bucket = item.type === "신규" ? acc.new : acc.growth;
    bucket.count += 1;
    bucket.amount += amount;
    if (!bucket.products[item.product]) bucket.products[item.product] = { count: 0, amount: 0 };
    bucket.products[item.product].count += 1;
    bucket.products[item.product].amount += amount;
    return acc;
  }, {
    total: { count: 0, amount: 0 },
    new: { count: 0, amount: 0, products: blankProductMap() },
    growth: { count: 0, amount: 0, products: blankProductMap() },
    done: 0
  });
}
function groupByOwner(items) {
  var map = {};
  items.forEach(function(item) {
    var owner = item.owner || "미지정";
    if (!map[owner]) map[owner] = [];
    map[owner].push(item);
  });
  return Object.keys(map).sort(function(a, b) {
    return summarize(map[b]).total.amount - summarize(map[a]).total.amount;
  }).map(function(owner) {
    return { owner: owner, items: map[owner], summary: summarize(map[owner]) };
  });
}
function productLines(summaryPart) {
  return products.map(function(name) {
    var item = summaryPart.products[name] || { count: 0, amount: 0 };
    return name + " " + item.count + "건 / " + won(item.amount);
  });
}
function renderProductBreakdown(targetId, summaryPart) {
  var box = document.getElementById(targetId);
  box.textContent = "";
  productLines(summaryPart).forEach(function(text) {
    var line = document.createElement("div");
    line.className = "product-line";
    var parts = text.split(" / ");
    var left = document.createElement("span");
    left.textContent = parts[0];
    var right = document.createElement("strong");
    right.textContent = parts[1];
    line.appendChild(left);
    line.appendChild(right);
    box.appendChild(line);
  });
}
function ownerProductText(summary) {
  return [
    "신규: " + productLines(summary.new).join(" · "),
    "증대: " + productLines(summary.growth).join(" · ")
  ];
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
  var left = document.createElement("div");
  var client = document.createElement("div");
  client.className = "client";
  client.textContent = item.client;
  var info = document.createElement("div");
  info.className = "report-info";
  info.textContent = item.date + " · " + item.product + " · " + won(item.amount);
  left.appendChild(client);
  left.appendChild(info);
  var badge = document.createElement("span");
  badge.className = "badge " + typeClass(item.type);
  badge.textContent = item.type;
  top.appendChild(left);
  top.appendChild(badge);

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
    deleteData(item.id).catch(function(error){ status("삭제 실패: " + error.message, "error"); toast(error.message); });
  });
  actions.appendChild(edit);
  actions.appendChild(del);

  card.appendChild(top);
  card.appendChild(actions);
  return card;
}
function renderOwnerCards(items) {
  ownerCards.textContent = "";
  groupByOwner(items).forEach(function(group) {
    var summary = group.summary;
    var pending = summary.total.count - summary.done;
    var card = document.createElement("div");
    card.className = "owner-card" + (openedOwner === group.owner ? " open" : "");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "owner-button" + (openedOwner === group.owner ? " active" : "");
    button.addEventListener("click", function() {
      openedOwner = openedOwner === group.owner ? "" : group.owner;
      render();
    });

    var left = document.createElement("div");
    var name = document.createElement("div");
    name.className = "owner-name";
    name.textContent = group.owner;
    var meta = document.createElement("div");
    meta.className = "owner-meta";
    meta.innerHTML =
      "<span>신규 " + summary.new.count + "건 / " + won(summary.new.amount) + "</span>" +
      "<span>매출증대 " + summary.growth.count + "건 / " + won(summary.growth.amount) + "</span>" +
      "<span>처방입력 완료 " + summary.done + "건 / 미완료 " + pending + "건</span>";
    left.appendChild(name);
    left.appendChild(meta);

    var amount = document.createElement("div");
    amount.className = "owner-money";
    amount.textContent = won(summary.total.amount);

    var product = document.createElement("div");
    product.className = "product-meta";
    ownerProductText(summary).forEach(function(text) {
      var line = document.createElement("div");
      line.textContent = text;
      product.appendChild(line);
    });

    button.appendChild(left);
    button.appendChild(amount);
    button.appendChild(product);

    var detail = document.createElement("div");
    detail.className = "detail-list";
    group.items
      .slice()
      .sort(function(a,b){ return Number(b.createdAt || 0) - Number(a.createdAt || 0); })
      .forEach(function(item){ detail.appendChild(reportCard(item)); });

    card.appendChild(button);
    card.appendChild(detail);
    ownerCards.appendChild(card);
  });
}
function renderTable(items) {
  rows.textContent = "";
  items
    .slice()
    .sort(function(a,b){ return Number(b.createdAt || 0) - Number(a.createdAt || 0); })
    .forEach(function(item) {
      var tr = document.createElement("tr");
      [item.date, item.owner, item.client, item.product, item.type, won(item.amount)].forEach(function(text) {
        var td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      var doneTd = document.createElement("td");
      doneTd.appendChild(prescriptionButton(item));
      tr.appendChild(doneTd);

      var tools = document.createElement("td");
      var edit = document.createElement("button");
      edit.className = "btn";
      edit.type = "button";
      edit.textContent = "수정";
      edit.addEventListener("click", function(){ startEdit(item); });
      var del = document.createElement("button");
      del.className = "btn danger";
      del.type = "button";
      del.textContent = "삭제";
      del.addEventListener("click", function(){ deleteData(item.id).catch(function(error){ status("삭제 실패: " + error.message, "error"); toast(error.message); }); });
      tools.appendChild(edit);
      tools.appendChild(document.createTextNode(" "));
      tools.appendChild(del);
      tr.appendChild(tools);
      rows.appendChild(tr);
    });
}
function render() {
  var items = monthItems();
  var summary = summarize(items);
  var doneRate = summary.total.count ? Math.round(summary.done / summary.total.count * 100) : 0;
  document.getElementById("monthLabel").textContent = selectedMonthLabel();
  document.getElementById("totalAmount").textContent = won(summary.total.amount);
  document.getElementById("totalCount").textContent = summary.total.count + "건";
  document.getElementById("newAmount").textContent = won(summary.new.amount);
  document.getElementById("newCount").textContent = summary.new.count + "건";
  document.getElementById("growthAmount").textContent = won(summary.growth.amount);
  document.getElementById("growthCount").textContent = summary.growth.count + "건";
  document.getElementById("doneRate").textContent = doneRate + "%";
  document.getElementById("doneCount").textContent = summary.done + " / " + summary.total.count + "건";
  document.getElementById("empty").style.display = items.length ? "none" : "block";
  renderProductBreakdown("newProductBreakdown", summary.new);
  renderProductBreakdown("growthProductBreakdown", summary.growth);
  renderOwnerCards(items);
  renderTable(items);
}

function resetAfterSave() {
  editingId = "";
  clientInput.value = "";
  productInput.value = "";
  amountInput.value = "";
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
  document.querySelectorAll("[data-type]").forEach(function(button) {
    button.classList.toggle("active", button.dataset.type === selectedType);
  });
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
  document.querySelectorAll("[data-type]").forEach(function(button) {
    button.classList.toggle("active", button.dataset.type === selectedType);
  });
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
    document.querySelectorAll("[data-type]").forEach(function(item) { item.classList.remove("active"); });
    button.classList.add("active");
  });
});
document.getElementById("prevMonthBtn").addEventListener("click", function(){ moveMonth(-1); });
document.getElementById("nextMonthBtn").addEventListener("click", function(){ moveMonth(1); });
document.getElementById("currentMonthBtn").addEventListener("click", resetToCurrentMonth);
document.getElementById("cancelEditBtn").addEventListener("click", resetFormAll);
document.getElementById("stickySubmitBtn").addEventListener("click", function(){ form.requestSubmit(); });

form.addEventListener("submit", async function(e) {
  e.preventDefault();
  var owner = ownerInput.value.trim();
  if (!owner) { toast("담당자 이름을 입력해주세요."); return; }
  if (!clientInput.value.trim()) { toast("거래처명을 입력해주세요."); clientInput.focus(); return; }
  if (!productInput.value) { toast("품목을 선택해주세요."); productInput.focus(); return; }
  if (!amountMan(amountInput.value)) { toast("예상 금액을 만원 단위로 입력해주세요."); amountInput.focus(); return; }

  localStorage.setItem("ownerName", owner);
  var old = reports.find(function(x){ return x.id === editingId; }) || {};
  var item = {
    id: editingId || makeId(),
    createdAt: editingId ? (old.createdAt || Date.now()) : Date.now(),
    updatedAt: Date.now(),
    date: dateInput.value,
    owner: owner,
    client: clientInput.value.trim(),
    type: selectedType,
    product: productInput.value,
    amount: amountWon(amountInput.value),
    prescriptionDone: editingId ? Boolean(old.prescriptionDone) : false
  };
  var wasEditing = Boolean(editingId);
  try {
    if (wasEditing) await updateData(item);
    else await addData(item);
    resetAfterSave();
  } catch (error) {
    status("저장 실패: " + error.message, "error");
    toast(error.message);
  }
});

document.getElementById("exportBtn").addEventListener("click", function() {
  var data = [["날짜","담당자","거래처명","구분","품목","예상 금액","처방입력 완료"]];
  monthItems().forEach(function(x){ data.push([x.date, x.owner, x.client, x.type, x.product, x.amount, x.prescriptionDone ? "완료" : "미완료"]); });
  var csv = data.map(function(row){ return row.map(function(cell){ return '"' + String(cell || "").replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
  var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "영업일일보고_" + selectedYear + "-" + String(selectedMonth).padStart(2, "0") + ".csv";
  a.click();
  URL.revokeObjectURL(url);
});

updateAmountPreview();
loadData().catch(function(error){ status("연결 실패: " + error.message, "error"); toast(error.message); });
