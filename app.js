var money = new Intl.NumberFormat("ko-KR");
var today = new Date();
var todayText = dateText(today);
var currentMonth = String(today.getMonth() + 1);
var currentYear = String(today.getFullYear());
var reports = [];
var selectedType = "신규";
var activeView = "list";
var selectedDate = todayText;
var selectedOwnerMonth = currentMonth;
var selectedOwner = "";
var editingId = "";

var form = document.getElementById("reportForm");
var rows = document.getElementById("rows");
var ownerInput = document.getElementById("owner");
var dateInput = document.getElementById("date");
var clientInput = document.getElementById("client");
var productInput = document.getElementById("product");
var amountInput = document.getElementById("amount");
var dateSelect = document.getElementById("dateSelect");
var ownerMonth = document.getElementById("ownerMonth");

dateInput.value = todayText;
dateSelect.value = todayText;
ownerMonth.value = currentMonth;
ownerInput.value = localStorage.getItem("ownerName") || "";

function dateText(d) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}
function shiftDate(text, days) {
  var d = new Date(text + "T00:00:00");
  d.setDate(d.getDate() + days);
  return dateText(d);
}
function makeId() { return Date.now() + "-" + Math.random().toString(16).slice(2); }
function digits(v) { return String(v || "").replace(/[^\d]/g, ""); }
function parseAmount(v) { return Number(digits(v) || 0); }
function won(v) { var n = Number(v || 0); return n ? money.format(n) + "원" : "-"; }
function monthOf(x) { return x.date ? String(Number(String(x.date).slice(5, 7))) : currentMonth; }
function yearOf(x) { return x.date ? String(x.date).slice(0, 4) : currentYear; }
function isThisMonth(x) { return yearOf(x) === currentYear && monthOf(x) === currentMonth; }
function toast(msg) {
  document.getElementById("toast").textContent = msg;
  setTimeout(function(){ document.getElementById("toast").textContent = ""; }, 2200);
}

async function api(method, body, query) {
  var options = { method: method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  var response = await fetch("/api/reports" + (query || ""), options);
  var data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청 실패");
  return data;
}
async function loadData() {
  reports = await api("GET");
  render();
}
async function addData(item) {
  await api("POST", item);
  await loadData();
  toast("저장되었습니다.");
}
async function updateData(item) {
  await api("PUT", item);
  await loadData();
  toast("수정되었습니다.");
}
async function deleteData(id) {
  await api("DELETE", null, "?id=" + encodeURIComponent(id));
  await loadData();
  toast("삭제되었습니다.");
}
async function deleteSelectedData(ids) {
  await api("DELETE", null, "?" + ids.map(function(id){ return "id=" + encodeURIComponent(id); }).join("&"));
  await loadData();
  toast("선택 삭제되었습니다.");
}

function filtered() {
  return reports.filter(function(x) {
    if (activeView === "date") return x.date === selectedDate && (!selectedOwner || x.owner === selectedOwner);
    if (activeView === "owner") {
      var monthOk = selectedOwnerMonth === "all" || monthOf(x) === selectedOwnerMonth;
      return monthOk && (!selectedOwner || x.owner === selectedOwner);
    }
    return isThisMonth(x);
  });
}
function summarize(items) {
  var map = {};
  items.forEach(function(x) {
    var key = x.owner || "미지정";
    if (!map[key]) map[key] = { amount: 0, newCount: 0, growthCount: 0 };
    map[key].amount += Number(x.amount || 0);
    if (x.type === "신규") map[key].newCount += 1;
    if (x.type === "매출증대") map[key].growthCount += 1;
  });
  return map;
}
function add(parent, tag, text) {
  var el = document.createElement(tag);
  el.textContent = text;
  parent.appendChild(el);
  return el;
}
function renderOwners(id, items, emptyText) {
  var box = document.getElementById(id);
  var map = summarize(items);
  var names = Object.keys(map).sort(function(a,b){ return map[b].amount - map[a].amount; });
  box.textContent = "";
  if (!names.length) {
    var empty = document.createElement("div");
    add(empty, "span", emptyText); add(empty, "span", "-"); add(empty, "span", "-"); add(empty, "span", "-");
    box.appendChild(empty);
    return;
  }
  names.forEach(function(name) {
    var v = map[name];
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-owner", name);
    btn.className = selectedOwner === name ? "active" : "";
    add(btn, "strong", name);
    add(btn, "span", "신규 " + v.newCount + "건");
    add(btn, "span", "증대 " + v.growthCount + "건");
    add(btn, "span", won(v.amount));
    box.appendChild(btn);
  });
}
function renderMonthGroups(items) {
  var box = document.getElementById("monthGroups");
  box.textContent = "";
  if (activeView !== "owner" || selectedOwnerMonth !== "all") return;
  var map = {};
  items.forEach(function(x) {
    var key = monthOf(x) + "월";
    if (!map[key]) map[key] = { amount: 0, clients: [], newCount: 0, growthCount: 0 };
    map[key].amount += Number(x.amount || 0);
    map[key].clients.push(x.client);
    if (x.type === "신규") map[key].newCount += 1;
    if (x.type === "매출증대") map[key].growthCount += 1;
  });
  Object.keys(map).sort(function(a,b){ return Number(a.replace("월","")) - Number(b.replace("월","")); }).forEach(function(month) {
    var v = map[month];
    var g = document.createElement("div");
    g.className = "month-group";
    add(g, "strong", month + " 총 " + won(v.amount));
    add(g, "span", "신규 " + v.newCount + "건 / 매출증대 " + v.growthCount + "건");
    add(g, "span", v.clients.join(" / "));
    box.appendChild(g);
  });
}
function label() {
  if (activeView === "date") return selectedOwner ? selectedDate + " " + selectedOwner : selectedDate + " 전체";
  if (activeView === "owner") return selectedOwnerMonth === "all" ? (selectedOwner ? selectedOwner + " 전체" : "담당자별 전체") : (selectedOwner ? selectedOwner + " " + selectedOwnerMonth + "월" : "담당자별 " + selectedOwnerMonth + "월");
  return "이번 달 전체";
}
function renderTable(items) {
  rows.textContent = "";
  items.forEach(function(x) {
    var tr = document.createElement("tr");
    var td0 = document.createElement("td");
    var cb = document.createElement("input");
    cb.type = "checkbox"; cb.className = "row-check"; cb.value = x.id; td0.appendChild(cb); tr.appendChild(td0);
    add(tr, "td", x.date);
    var tdOwner = document.createElement("td");
    var ob = document.createElement("button");
    ob.type = "button"; ob.className = "owner-link"; ob.setAttribute("data-owner", x.owner); ob.textContent = x.owner;
    tdOwner.appendChild(ob); tr.appendChild(tdOwner);
    add(tr, "td", x.client);
    add(tr, "td", x.product);
    var tdType = document.createElement("td");
    var badge = document.createElement("span");
    badge.className = "badge " + (x.type === "신규" ? "new" : "growth");
    badge.textContent = x.type;
    tdType.appendChild(badge); tr.appendChild(tdType);
    add(tr, "td", won(x.amount));
    var tdTool = document.createElement("td");
    var edit = document.createElement("button");
    edit.type = "button"; edit.className = "btn edit-btn"; edit.setAttribute("data-id", x.id); edit.textContent = "수정";
    var del = document.createElement("button");
    del.type = "button"; del.className = "btn danger delete-btn"; del.setAttribute("data-id", x.id); del.textContent = "삭제";
    tdTool.appendChild(edit); tdTool.appendChild(document.createTextNode(" ")); tdTool.appendChild(del); tr.appendChild(tdTool);
    rows.appendChild(tr);
  });
}
function render() {
  var visible = filtered().sort(function(a,b){ return Number(b.createdAt || 0) - Number(a.createdAt || 0); });
  var total = visible.reduce(function(s,x){ return s + Number(x.amount || 0); }, 0);
  document.getElementById("resultLabel").textContent = label();
  document.getElementById("resultTotal").textContent = visible.length + "건";
  document.getElementById("amountTotal").textContent = money.format(total) + "원";
  renderOwners("dateSummary", reports.filter(function(x){ return x.date === selectedDate; }), "선택한 날짜에 입력 없음");
  renderOwners("ownerSummary", selectedOwnerMonth === "all" ? reports : reports.filter(function(x){ return monthOf(x) === selectedOwnerMonth; }), "담당자별 입력 없음");
  renderMonthGroups(visible);
  document.getElementById("datePanel").classList.toggle("active", activeView === "date");
  document.getElementById("ownerPanel").classList.toggle("active", activeView === "owner");
  renderTable(visible);
  document.getElementById("empty").style.display = visible.length ? "none" : "block";
}
function resetForm() {
  editingId = "";
  form.reset();
  ownerInput.value = localStorage.getItem("ownerName") || "";
  dateInput.value = todayText;
  selectedType = "신규";
  document.querySelectorAll("[data-type]").forEach(function(b){ b.classList.toggle("active", b.dataset.type === "신규"); });
  document.getElementById("submitBtn").textContent = "저장";
}

amountInput.addEventListener("input", function(){ amountInput.value = digits(amountInput.value) ? money.format(Number(digits(amountInput.value))) : ""; });
document.querySelectorAll("[data-type]").forEach(function(b) {
  b.addEventListener("click", function(){ selectedType = b.dataset.type; document.querySelectorAll("[data-type]").forEach(function(x){ x.classList.remove("active"); }); b.classList.add("active"); });
});
document.querySelectorAll(".tab").forEach(function(b) {
  b.addEventListener("click", function(){ activeView = b.dataset.view; selectedOwner = ""; document.querySelectorAll(".tab").forEach(function(x){ x.classList.remove("active"); }); b.classList.add("active"); render(); });
});
dateSelect.addEventListener("change", function(){ selectedDate = dateSelect.value; selectedOwner = ""; render(); });
document.getElementById("prevDateBtn").addEventListener("click", function(){ selectedDate = shiftDate(selectedDate, -1); dateSelect.value = selectedDate; selectedOwner = ""; render(); });
document.getElementById("nextDateBtn").addEventListener("click", function(){ selectedDate = shiftDate(selectedDate, 1); dateSelect.value = selectedDate; selectedOwner = ""; render(); });
ownerMonth.addEventListener("change", function(){ selectedOwnerMonth = ownerMonth.value; selectedOwner = ""; render(); });
document.getElementById("dateSummary").addEventListener("click", function(e){ var b = e.target.closest("[data-owner]"); if (!b) return; selectedOwner = selectedOwner === b.dataset.owner ? "" : b.dataset.owner; render(); });
document.getElementById("ownerSummary").addEventListener("click", function(e){ var b = e.target.closest("[data-owner]"); if (!b) return; selectedOwner = selectedOwner === b.dataset.owner ? "" : b.dataset.owner; render(); });
form.addEventListener("submit", async function(e) {
  e.preventDefault();
  var owner = ownerInput.value.trim();
  if (!owner) { toast("담당자 이름을 입력해주세요."); return; }
  localStorage.setItem("ownerName", owner);
  var old = reports.find(function(x){ return x.id === editingId; }) || {};
  var item = { id: editingId || makeId(), createdAt: editingId ? (old.createdAt || Date.now()) : Date.now(), updatedAt: Date.now(), date: dateInput.value, owner: owner, client: clientInput.value.trim(), type: selectedType, product: productInput.value, amount: parseAmount(amountInput.value) };
  var wasEditing = !!editingId;
  resetForm();
  try {
    if (wasEditing) await updateData(item);
    else await addData(item);
  } catch (error) {
    toast(error.message);
  }
});
document.getElementById("cancelEditBtn").addEventListener("click", function(){ resetForm(); });
rows.addEventListener("click", async function(e) {
  var ownerBtn = e.target.closest(".owner-link");
  var editBtn = e.target.closest(".edit-btn");
  var deleteBtn = e.target.closest(".delete-btn");
  if (ownerBtn) { activeView = "owner"; selectedOwner = ownerBtn.dataset.owner; document.querySelectorAll(".tab").forEach(function(x){ x.classList.toggle("active", x.dataset.view === "owner"); }); render(); return; }
  if (editBtn) {
    var item = reports.find(function(x){ return x.id === editBtn.dataset.id; });
    if (!item) return;
    editingId = item.id; ownerInput.value = item.owner; dateInput.value = item.date; clientInput.value = item.client; productInput.value = item.product; amountInput.value = money.format(Number(item.amount || 0)); selectedType = item.type;
    document.querySelectorAll("[data-type]").forEach(function(b){ b.classList.toggle("active", b.dataset.type === selectedType); });
    document.getElementById("submitBtn").textContent = "수정 저장";
  }
  if (deleteBtn) {
    if (!confirm("삭제할까요?")) return;
    try { await deleteData(deleteBtn.dataset.id); } catch (error) { toast(error.message); }
  }
});
document.getElementById("selectAll").addEventListener("change", function(e){ document.querySelectorAll(".row-check").forEach(function(c){ c.checked = e.target.checked; }); });
document.getElementById("deleteSelectedBtn").addEventListener("click", async function() {
  var ids = Array.prototype.map.call(document.querySelectorAll(".row-check:checked"), function(c){ return c.value; });
  if (!ids.length) { toast("선택한 보고가 없습니다."); return; }
  if (!confirm(ids.length + "건을 삭제할까요?")) return;
  try { await deleteSelectedData(ids); } catch (error) { toast(error.message); }
});
document.getElementById("clearBtn").addEventListener("click", function(){ toast("전체 삭제는 Supabase 테이블에서 직접 처리해주세요."); });
document.getElementById("exportBtn").addEventListener("click", function() {
  var data = [["날짜","월","담당자","거래처명","구분","품목","예상 금액"]];
  reports.forEach(function(x){ data.push([x.date, monthOf(x) + "월", x.owner, x.client, x.type, x.product, x.amount]); });
  var csv = data.map(function(row){ return row.map(function(cell){ return '"' + String(cell || "").replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
  var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = "영업일일보고_" + todayText + ".csv"; a.click(); URL.revokeObjectURL(url);
});
loadData().catch(function(error){ toast(error.message); });
