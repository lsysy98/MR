var performanceGrouping = 'owner';
var performanceOwner = '';

function performanceBranchName(item) {
  return String(item.branchName || '').trim().replace(/\s+/g, '') || '지점 미지정';
}

function performanceGroups(items, grouping) {
  var groups = new Map();
  if (grouping === 'owner') ownerNames.forEach(function(owner) { groups.set(owner, []); });
  items.forEach(function(item) {
    var name = grouping === 'owner' ? item.owner : performanceBranchName(item);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  });
  return Array.from(groups, function(entry) { return { name: entry[0], summary: summarize(entry[1]) }; })
    .sort(function(a, b) { return b.summary.total.amount - a.summary.total.amount || a.name.localeCompare(b.name, 'ko'); });
}

function performanceHeadquartersGroups(items, owner) {
  var branches = new Map();
  var assigned = owner ? (analyticsOwnerBranches[owner] || []) : Object.keys(analyticsOwnerBranches).reduce(function(all, name) {
    return all.concat(analyticsOwnerBranches[name]);
  }, []);
  assigned.forEach(function(branch) { branches.set(branch, []); });
  items.forEach(function(item) {
    var branch = performanceBranchName(item);
    if (!branches.has(branch)) branches.set(branch, []);
    branches.get(branch).push(item);
  });
  var groups = new Map();
  branches.forEach(function(branchItems, branch) {
    var name = branchHeadquarters[branch] || '본부 미지정';
    if (!groups.has(name)) groups.set(name, { name: name, items: [], branches: [] });
    var group = groups.get(name);
    group.items = group.items.concat(branchItems);
    group.branches.push({ name: branch, summary: summarize(branchItems) });
  });
  var headquartersOrder = Array.from(new Set(assigned.map(function(branch) { return branchHeadquarters[branch]; })));
  var branchOrder = Array.from(new Set(assigned.concat(Object.keys(branchHeadquarters))));
  return Array.from(groups, function(entry) {
    var group = entry[1];
    group.branches.sort(function(a, b) {
      var ai = branchOrder.indexOf(a.name);
      var bi = branchOrder.indexOf(b.name);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
      return a.name.localeCompare(b.name, 'ko');
    });
    return { name: group.name, summary: summarize(group.items), branches: group.branches };
  }).sort(function(a, b) {
    if (a.name === '본부 미지정') return 1;
    if (b.name === '본부 미지정') return -1;
    var ai = headquartersOrder.indexOf(a.name);
    var bi = headquartersOrder.indexOf(b.name);
    if (ai >= 0 || bi >= 0) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
    return a.name.localeCompare(b.name, 'ko');
  });
}

function selectPerformanceGrouping(grouping, owner) {
  performanceGrouping = grouping;
  performanceOwner = grouping === 'branch' ? (owner || '') : '';
  renderPerformanceAnalysis();
}

function renderPerformanceAnalysis() {
  var panel = document.getElementById('analyticsPanel');
  if (!panel || !document.body.classList.contains('view-analytics')) return;
  var month = selectedYear + '-' + String(selectedMonth).padStart(2, '0');
  document.getElementById('analyticsMonth').value = month;
  document.getElementById('analyticsMonthLabel').textContent = selectedYear + '. ' + String(selectedMonth).padStart(2, '0');
  var byOwner = performanceGrouping === 'owner';
  document.getElementById('analyticsGroupTitle').textContent = byOwner ? '담당자' : '본부 / 지점';
  document.getElementById('analyticsCaption').textContent = month + ' 통계 수거 월 기준 ' + (byOwner ? '개인별' : (performanceOwner || '전체 담당자') + ' 지점별') + ' 실적';
  document.getElementById('analyticsOwnerFilter').hidden = byOwner;
  document.getElementById('analyticsOwner').value = performanceOwner;
  document.querySelectorAll('[data-analytics-group]').forEach(function(button) {
    var selected = button.dataset.analyticsGroup === performanceGrouping;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  var items = monthlyItems();
  if (!byOwner && performanceOwner) items = items.filter(function(item) { return item.owner === performanceOwner; });
  var body = document.getElementById('analyticsRows');
  var total = document.getElementById('analyticsTotal');
  body.replaceChildren();
  total.replaceChildren();
  function addRow(parent, name, summary, kind) {
    var row = document.createElement('tr');
    if (kind) row.className = 'analytics-' + kind + '-row';
    var label = document.createElement('th');
    label.scope = 'row';
    label.textContent = name;
    if (kind === 'owner') {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'analytics-person';
      button.textContent = name;
      button.setAttribute('aria-label', name + ' 지점별 실적 보기');
      var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'ui-icon');
      icon.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', 'assets/workspace-icons.svg#chevron-right');
      icon.appendChild(use);
      button.appendChild(icon);
      label.replaceChildren(button);
      row.title = name + ' 지점별 실적 보기';
      row.addEventListener('click', function() {
        selectPerformanceGrouping('branch', name);
        document.getElementById('analyticsOwner').focus({ preventScroll: true });
      });
    }
    row.appendChild(label);
    [summary.new.count + '건', won(summary.new.amount), summary.growth.count + '건', won(summary.growth.amount), summary.total.count + '건', won(summary.total.amount)].forEach(function(value) {
      var cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    parent.appendChild(row);
  }
  if (byOwner) {
    performanceGroups(items, 'owner').forEach(function(group) { addRow(body, group.name, group.summary, 'owner'); });
  } else {
    performanceHeadquartersGroups(items, performanceOwner).forEach(function(group) {
      addRow(body, group.name, group.summary, 'headquarters');
      group.branches.forEach(function(branch) { addRow(body, branch.name, branch.summary, 'branch'); });
    });
  }
  addRow(total, '합계', summarize(items));
  document.getElementById('analyticsEmpty').hidden = items.length > 0;
}

(function () {
  viewNames.push('analytics');
  document.querySelectorAll('[data-view="analytics"]').forEach(function(button) {
    button.addEventListener('click', renderPerformanceAnalysis);
  });
  var ownerSelect = document.getElementById('analyticsOwner');
  ownerNames.forEach(function(owner) {
    var option = document.createElement('option');
    option.value = owner;
    option.textContent = owner;
    ownerSelect.appendChild(option);
  });
  ownerSelect.addEventListener('change', function() {
    performanceOwner = ownerSelect.value;
    renderPerformanceAnalysis();
  });
  document.querySelectorAll('[data-analytics-group]').forEach(function(button) {
    button.addEventListener('click', function() {
      selectPerformanceGrouping(button.dataset.analyticsGroup);
    });
  });
  document.getElementById('analyticsPrevMonth').addEventListener('click', function() { moveMonth(-1); });
  document.getElementById('analyticsNextMonth').addEventListener('click', function() { moveMonth(1); });
  document.getElementById('analyticsMonthLabel').addEventListener('click', function() { openMonthPicker(document.getElementById('analyticsMonth')); });
  document.getElementById('analyticsMonth').addEventListener('change', function(event) { setSelectedMonthFromValue(event.target.value); });
})();
