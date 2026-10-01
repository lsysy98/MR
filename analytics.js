var performanceGrouping = 'owner';
var performanceOwner = '';
var performanceExpandedBranches = new Set();
var performanceBranchScope = '';

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
    group.branches.push({ name: branch, items: branchItems, summary: summarize(branchItems) });
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

function performanceBranchDetails(branch, id) {
  var items = branch.items.slice().sort(function(a, b) {
    return String(b.date).localeCompare(String(a.date)) || String(a.client).localeCompare(String(b.client), 'ko');
  });
  var branchSummary = summarize(items);
  var row = document.createElement('div');
  row.className = 'analytics-branch-detail';
  row.id = id;
  var panel = document.createElement('section');
  panel.className = 'analytics-client-panel';
  panel.setAttribute('aria-label', branch.name + ' 거래처');
  var heading = document.createElement('div');
  heading.className = 'analytics-client-heading';
  var title = document.createElement('strong');
  title.textContent = branch.name + ' 거래처';
  var summary = document.createElement('span');
  summary.textContent = '신규 ' + branchSummary.new.count + '건 · 증대 ' + branchSummary.growth.count + '건 · ' + won(branchSummary.total.amount);
  heading.append(title, summary);
  panel.appendChild(heading);
  if (!items.length) {
    var empty = document.createElement('p');
    empty.className = 'analytics-client-empty';
    empty.textContent = '선택한 월의 거래처가 없습니다.';
    panel.appendChild(empty);
  } else {
    var list = document.createElement('ul');
    list.className = 'analytics-client-list';
    items.forEach(function(item, index) {
      var entry = document.createElement('li');
      entry.className = 'report-card analytics-client-card ' + typeClass(item.type);
      entry.dataset.reportId = item.id;
      var number = document.createElement('div');
      number.className = 'report-number';
      number.textContent = String(index + 1);

      var top = document.createElement('div');
      top.className = 'report-top';
      var clientWrap = document.createElement('div');
      clientWrap.className = 'client-wrap';
      var name = document.createElement('div');
      name.className = 'client';
      name.textContent = item.client || '거래처명 미지정';
      clientWrap.appendChild(name);
      appendClientMeta(clientWrap, item);
      var amount = document.createElement('strong');
      amount.className = 'report-amount';
      amount.textContent = won(item.amount);
      top.append(clientWrap, amount);

      var info = document.createElement('div');
      info.className = 'report-info';
      var reportDate = document.createElement('time');
      reportDate.className = 'report-date';
      reportDate.dateTime = item.date || '';
      reportDate.textContent = item.date || '날짜 미지정';
      var separator = document.createElement('span');
      separator.className = 'report-info-separator';
      separator.setAttribute('aria-hidden', 'true');
      separator.textContent = '·';
      var product = document.createElement('span');
      product.className = 'report-product';
      product.textContent = productShortLabel(item.product);
      info.append(reportDate, separator, product);

      var bottom = document.createElement('div');
      bottom.className = 'report-bottom';
      var bottomLeft = document.createElement('div');
      bottomLeft.className = 'report-bottom-left';
      var badge = document.createElement('span');
      badge.className = 'badge ' + typeClass(item.type);
      badge.textContent = item.type;
      var owner = document.createElement('span');
      owner.className = 'analytics-client-owner';
      owner.textContent = item.owner || '담당자 미지정';
      bottomLeft.append(badge, owner);
      bottom.appendChild(bottomLeft);

      entry.append(number, top, info, bottom);
      list.appendChild(entry);
    });
    panel.appendChild(list);
  }
  row.appendChild(panel);
  return row;
}

function performanceMetric(summary, category, label, compact) {
  var metric = document.createElement('span');
  metric.className = 'analytics-metric analytics-metric-' + category;
  var title = document.createElement('span');
  title.className = 'analytics-metric-label';
  title.textContent = label;
  var amount = document.createElement('strong');
  var fullAmount = won(summary[category].amount);
  amount.textContent = fullAmount;
  if (compact) {
    amount.dataset.compact = wonMan(summary[category].amount).replace(/만원$/, '만') + '·' + summary[category].count + '건';
    amount.title = fullAmount;
  }
  var count = document.createElement('small');
  count.textContent = summary[category].count + '건';
  metric.append(title, amount, count);
  return metric;
}

function performanceEntry(group, kind, index) {
  var row = document.createElement('div');
  row.className = 'analytics-' + kind + '-row';
  var isHeadquarters = kind === 'headquarters';
  var button = document.createElement(isHeadquarters ? 'div' : 'button');
  button.className = 'analytics-item-button';
  if (!isHeadquarters) button.type = 'button';
  var identity = document.createElement('span');
  identity.className = 'analytics-identity';
  if (kind === 'owner') {
    var rank = document.createElement('span');
    rank.className = 'owner-avatar';
    rank.textContent = index + 1;
    rank.setAttribute('aria-hidden', 'true');
    identity.appendChild(rank);
  }
  var name = document.createElement(isHeadquarters ? 'h4' : 'strong');
  name.className = 'analytics-name';
  name.textContent = group.name;
  identity.appendChild(name);
  var metrics = document.createElement('span');
  metrics.className = 'analytics-metrics';
  metrics.id = 'analytics-metrics-' + index;
  ['total', 'new', 'growth'].forEach(function(category, i) {
    metrics.appendChild(performanceMetric(group.summary, category, ['전체 금액', '신규', '매출증대'][i], true));
  });
  button.append(identity, metrics);
  row.appendChild(button);
  if (isHeadquarters) return row;
  button.setAttribute('aria-label', group.name + (kind === 'owner' ? ' 지점별 실적 보기' : ' 거래처 보기'));
  button.setAttribute('aria-describedby', metrics.id);
  var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'ui-icon analytics-chevron');
  icon.setAttribute('aria-hidden', 'true');
  var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', 'assets/workspace-icons.svg#' + (kind === 'owner' ? 'chevron-right' : 'chevron-down'));
  icon.appendChild(use);
  button.appendChild(icon);
  if (kind === 'owner') {
    button.addEventListener('click', function() {
      selectPerformanceGrouping('branch', group.name);
      document.getElementById('analyticsOwner').focus({ preventScroll: true });
    });
  } else {
    var details = performanceBranchDetails(group, 'analytics-branch-' + index);
    button.setAttribute('aria-controls', details.id);
    function updateExpanded() {
      var expanded = performanceExpandedBranches.has(group.name);
      details.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      row.classList.toggle('is-expanded', expanded);
    }
    updateExpanded();
    button.addEventListener('click', function() {
      if (performanceExpandedBranches.has(group.name)) performanceExpandedBranches.delete(group.name);
      else performanceExpandedBranches.add(group.name);
      updateExpanded();
    });
    row.appendChild(details);
  }
  return row;
}

function renderPerformanceAnalysis() {
  var panel = document.getElementById('analyticsPanel');
  if (!panel || !document.body.classList.contains('view-analytics')) return;
  var month = selectedYear + '-' + String(selectedMonth).padStart(2, '0');
  var scope = month + '/' + performanceGrouping + '/' + performanceOwner;
  if (performanceBranchScope !== scope) {
    performanceExpandedBranches.clear();
    performanceBranchScope = scope;
  }
  document.getElementById('analyticsMonth').value = month;
  document.getElementById('analyticsMonthLabel').textContent = selectedYear + '. ' + String(selectedMonth).padStart(2, '0');
  var byOwner = performanceGrouping === 'owner';
  document.getElementById('analyticsGroupTitle').textContent = byOwner ? '담당자별 실적' : '본부 · 지점별 실적';
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
  var total = document.getElementById('analyticsSummary');
  body.replaceChildren();
  total.replaceChildren();
  var summary = summarize(items);
  ['total', 'new', 'growth'].forEach(function(category, i) {
    total.appendChild(performanceMetric(summary, category, ['전체 금액', '신규', '매출증대'][i]));
  });
  body.className = byOwner ? 'analytics-owner-list' : 'analytics-branch-groups';
  if (byOwner) {
    var owners = performanceGroups(items, 'owner');
    document.getElementById('analyticsGroupCount').textContent = owners.length + '명';
    owners.forEach(function(group, index) { body.appendChild(performanceEntry(group, 'owner', index)); });
  } else {
    var groups = performanceHeadquartersGroups(items, performanceOwner);
    var branchCount = 0;
    var index = 0;
    groups.forEach(function(group) {
      var section = document.createElement('section');
      section.className = 'analytics-headquarters-group';
      section.setAttribute('aria-label', group.name);
      section.appendChild(performanceEntry(group, 'headquarters', index++));
      var branches = document.createElement('div');
      branches.className = 'analytics-branch-list';
      group.branches.forEach(function(branch) {
        branches.appendChild(performanceEntry(branch, 'branch', index++));
        branchCount++;
      });
      section.appendChild(branches);
      body.appendChild(section);
    });
    document.getElementById('analyticsGroupCount').textContent = groups.length + '개 본부 · ' + branchCount + '개 지점';
  }
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
