(function () {
  'use strict';
  var svgNS = 'http://www.w3.org/2000/svg';
  function icon(name, className) {
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'ui-icon' + (className ? ' ' + className : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(svgNS, 'use');
    use.setAttribute('href', 'assets/workspace-icons.svg#' + name);
    svg.appendChild(use);
    return svg;
  }
  function byId(id) { return document.getElementById(id); }
  function replaceWithIcon(id, name) {
    var button = byId(id);
    if (!button) return;
    var label = button.textContent.trim();
    button.setAttribute('aria-label', label);
    button.title = label;
    button.classList.add('icon-only');
    button.replaceChildren(icon(name));
  }
  document.querySelectorAll('[data-icon]').forEach(function (placeholder) {
    placeholder.replaceWith(icon(placeholder.dataset.icon));
  });
  document.querySelectorAll('.date-input-wrap').forEach(function (wrap) { wrap.appendChild(icon('calendar-days', 'date-input-icon')); });
  ['prevCollectionBtn', 'prevMonthBtn', 'meetingPrevMonthBtn', 'prevDayBtn', 'prevWeekBtn', 'calendarPrevBtn'].forEach(function (id) { replaceWithIcon(id, 'chevron-left'); });
  ['nextCollectionBtn', 'nextMonthBtn', 'meetingNextMonthBtn', 'nextDayBtn', 'nextWeekBtn', 'calendarNextBtn'].forEach(function (id) { replaceWithIcon(id, 'chevron-right'); });
  ['manualClientCloseBtn', 'exhibitionDetailCloseBtn', 'exhibitionCloseBtn'].forEach(function (id) { replaceWithIcon(id, 'x'); });
  replaceWithIcon('ownerSearchBtn', 'search');
  replaceWithIcon('cancelEditBtn', 'rotate-ccw');

  function decorateCommand(id, name) {
    var button = byId(id);
    if (!button) return;
    function decorate() {
      if (!button.querySelector('svg')) button.prepend(icon(name));
    }
    button.classList.add('icon-command');
    decorate();
    new MutationObserver(decorate).observe(button, { childList: true });
  }
  decorateCommand('submitBtn', 'plus');
  decorateCommand('completeDayBtn', 'circle-check');
  decorateCommand('leaveDayBtn', 'calendar-off');
  decorateCommand('confirmCopyWeeklyReportBtn', 'copy');
  decorateCommand('copyWeeklyReportBtn', 'copy');
  decorateCommand('manualClientAddToggleBtn', 'plus');
  decorateCommand('exhibitionFormToggleBtn', 'plus');

  function avatar(name, rank) {
    var node = document.createElement('span');
    node.className = 'owner-avatar';
    node.textContent = rank || (ownerNames.indexOf(name) + 1);
    node.dataset.tone = String(Math.max(0, ownerNames.indexOf(name)) % 5);
    node.setAttribute('aria-hidden', 'true');
    return node;
  }
  function decorateOwners(root, monthly) {
    if (!root) return;
    root.querySelectorAll('.owner-card').forEach(function (card, index) {
      var button = card.querySelector('.owner-button');
      if (!button) return;
      button.setAttribute('aria-expanded', String(card.classList.contains('open')));
      var status = button.querySelector('.daily-status');
      if (status && !status.querySelector('svg')) {
        status.prepend(icon(status.classList.contains('done') ? 'circle-check' : status.classList.contains('leave') ? 'calendar-off' : 'clock'));
      }
      var details = card.querySelector('.detail-list');
      if (details) {
        details.id = root.id + '-details-' + index;
        button.setAttribute('aria-controls', details.id);
      }
      if (!button.querySelector('.owner-identity')) {
        var title = button.querySelector('.owner-title') || button.querySelector('.owner-name');
        if (title) {
          var identity = document.createElement('div');
          identity.className = 'owner-identity';
          title.before(identity);
          identity.appendChild(avatar(card.dataset.owner || '', index + 1));
          identity.appendChild(title);
        }
        button.appendChild(icon('chevron-right', 'owner-chevron'));
      }
      if (monthly) {
        var rate = button.querySelector('.owner-rate');
        if (rate && !button.querySelector('.owner-performance')) {
          var performance = document.createElement('div');
          performance.className = 'owner-performance';
          var achievement = document.createElement('strong');
          achievement.textContent = rate.textContent;
          achievement.setAttribute('aria-label', '목표 달성률 ' + rate.textContent);
          achievement.classList.toggle('is-over-target', parseFloat(rate.textContent) >= 100);
          var meta = document.createElement('div');
          meta.className = 'owner-performance-meta';
          var progress = document.createElement('span');
          progress.className = 'owner-progress';
          progress.setAttribute('aria-hidden', 'true');
          var fill = document.createElement('i');
          fill.style.width = Math.max(0, Math.min(100, parseFloat(rate.textContent) || 0)) + '%';
          progress.appendChild(fill);
          rate.before(performance);
          meta.appendChild(progress);
          performance.append(achievement, meta);
          rate.remove();
        }
      }
    });
  }
  function decorateMeeting() {
    byId('meetingCards').querySelectorAll('.meeting-owner-head').forEach(function (head, index) {
      var name = head.querySelector('strong');
      if (name && !head.querySelector('.owner-avatar')) head.prepend(avatar(name.textContent, index + 1));
    });
  }
  document.querySelectorAll('.date-label, .week-label').forEach(function (label) {
    label.title = label.classList.contains('week-label') ? '주차 선택' : '날짜 선택';
  });
  document.querySelectorAll('.official-osstem-mascot').forEach(function (image) {
    image.addEventListener('load', function () { image.parentElement.classList.add('has-official'); });
    if (image.complete && image.naturalWidth) image.parentElement.classList.add('has-official');
  });
  function dateLabel(value) {
    var date = parseDateText(value);
    return date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' + date.getDate() + '일 ' + ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] + '요일';
  }
  function refresh() {
    var view = activeViewName();
    var titles = { form: '보고 작성', today: '일일현황', dashboard: '월간현황', meeting: '회의자료', codes: '코드 확인' };
    byId('workspaceTitle').textContent = titles[view] || '일일현황';
    byId('workspaceSection').textContent = view === 'form' ? '보고 작성' : view === 'meeting' ? '회의자료' : view === 'codes' ? '거래처' : '보고 현황';
    var rangeText = view === 'dashboard' || view === 'meeting' ? selectedYear + '년 ' + selectedMonth + '월' : dateLabel(selectedTeamDate);
    if (view === 'today' && selectedTeamPeriod === 'week') rangeText = weekLabelFromStart(selectedWeekStart);
    if (view === 'form' || view === 'codes') rangeText = dateLabel(todayText);
    byId('workspaceDate').textContent = rangeText;
    var owner = ownerInput.value || '';
    byId('workspaceOwner').textContent = owner || '담당자 미선택';
    byId('workspaceProfile').querySelector('.profile-avatar').textContent = owner ? owner.slice(0, 1) : 'MR';
    byId('workspaceDraftMode').textContent = editingId ? '수정 중' : '새 보고';
    document.querySelectorAll('[data-view]').forEach(function (button) {
      if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    var completion = byId('workspaceCompletion');
    completion.replaceChildren();
    if (selectedTeamPeriod === 'day') {
      if (completionLoadError) completion.textContent = '완료 현황 연결 확인 필요';
      else {
        var stats = completionStats();
        var count = document.createElement('b');
        count.textContent = stats.done.length + ' / ' + ownerNames.length;
        completion.append('보고 완료 ', count);
        if (stats.leave.length) completion.append(' · 연차 ' + stats.leave.length);
      }
    } else completion.textContent = '주간 합계';
    decorateOwners(byId('todayOwnerCards'), false);
    decorateOwners(byId('ownerCards'), true);
    decorateMeeting();
    document.querySelectorAll('.report-card').forEach(function (card) {
      if (card.dataset.keyboardReady) return;
      card.dataset.keyboardReady = 'true';
      card.tabIndex = 0;
      card.setAttribute('role', 'group');
      card.setAttribute('aria-label', (card.querySelector('.client') || card).textContent.trim());
      card.addEventListener('keydown', function (event) {
        if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); card.click(); }
      });
    });
  }
  var scheduled = false;
  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(function () { scheduled = false; refresh(); });
  }
  ['ownerCards', 'todayOwnerCards', 'meetingCards', 'submitBtn'].forEach(function (id) {
    new MutationObserver(scheduleRefresh).observe(byId(id), { childList: true });
  });
  new MutationObserver(scheduleRefresh).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  ownerInput.addEventListener('change', scheduleRefresh);
  refresh();
})();
