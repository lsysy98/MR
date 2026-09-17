(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var busy = false;
  var opener;
  var oldOverflow;
  var active;
  function setStatus(id, message, error) { $(id).textContent = message; $(id).classList.toggle('error', Boolean(error)); }
  function open(id) {
    closeAdminMenu(); opener = document.activeElement; active = $(id); active.hidden = false;
    oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    active.querySelector('[data-tools-close]').focus();
  }
  function close() {
    if (busy || !active) return;
    active.hidden = true; document.body.style.overflow = oldOverflow; active = null;
    if (opener) opener.focus();
  }
  document.querySelectorAll('[data-tools-close]').forEach(function (button) { button.addEventListener('click', close); });
  document.addEventListener('keydown', function (event) {
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    if (event.key !== 'Tab') return;
    var targets = Array.from(active.querySelectorAll('button,input,select')).filter(function (el) { return !el.disabled && el.getClientRects().length; });
    var first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, true);
  async function request(url, body) {
    var controller = new AbortController(); var timer = setTimeout(function () { controller.abort(); }, 60000);
    try {
      var response = await fetch(url, { method: body ? 'POST' : 'GET', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined });
      var raw = await response.text(); var data;
      try { data = JSON.parse(raw); } catch (_) { throw new Error('서버 응답이 늦거나 올바르지 않습니다. 잠시 후 다시 시도해주세요.'); }
      if (!response.ok) {
        if (/schema cache|does not exist/i.test(data.error || '')) throw new Error('알림용 SQL을 원본 Supabase에 한 번 적용해주세요.');
        throw new Error(data.error || '요청에 실패했습니다.');
      }
      return data;
    } finally { clearTimeout(timer); }
  }
  async function task(status, run, refresh) {
    if (busy) return;
    busy = true;
    active.querySelectorAll('button,input,select').forEach(function (el) { el.disabled = true; });
    try { await run(); }
    catch (error) { setStatus(status, error.name === 'AbortError' ? '응답이 늦습니다. 잠시 후 다시 확인해주세요.' : error.message, true); }
    finally {
      busy = false; active.querySelectorAll('button,input,select').forEach(function (el) { el.disabled = false; }); refresh();
    }
  }


  var settings = null, registration = null, saved = {}, connected = false;
  try { saved = JSON.parse(localStorage.getItem('reportPushDevice') || '{}'); } catch (_) {}
  function persist() { localStorage.setItem('reportPushDevice', JSON.stringify(saved)); }
  var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var needsHome = ios && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone;
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
  ownerNames.forEach(function (owner) { var option = document.createElement('option'); option.value = owner; option.textContent = owner; $('notificationOwner').append(option); });
  $('notificationOwner').value = saved.owner || '';
  $('notificationTime').value = saved.reminderTime || '18:00';
  function refreshNotifications() {
    var changed = connected && ($('notificationOwner').value !== saved.owner || $('notificationTime').value !== saved.reminderTime);
    $('notificationEnable').disabled = !supported || needsHome || !settings || !settings.ready || !registration || !$('notificationOwner').value || !$('notificationTime').validity.valid;
    $('notificationEnable').textContent = changed ? '알림 설정 저장' : (connected ? '알림 연결 확인' : '알림 받기');
    $('notificationTest').disabled = !connected || changed || !settings || !settings.ready;
    $('notificationDisable').disabled = !registration || (!saved.id && !connected);
  }
  $('notificationOwner').addEventListener('change', refreshNotifications);
  $('notificationTime').addEventListener('input', refreshNotifications);
  $('notificationTime').addEventListener('change', refreshNotifications);
  $('menuNotificationsBtn').addEventListener('click', function () {
    open('notificationsOverlay');
    task('notificationStatus', async function () {
      $('notificationIosHint').hidden = !needsHome;
      if (needsHome) { setStatus('notificationStatus', '홈 화면에서 열어야 알림을 허용할 수 있습니다.'); return; }
      if (!supported) { setStatus('notificationStatus', '현재 브라우저에서는 웹 알림을 사용할 수 없습니다. Chrome 또는 지원되는 Safari로 열어주세요.', true); return; }
      settings = await request('/api/notifications');
      registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      var subscription = await registration.pushManager.getSubscription();
      connected = false;
      if (saved.id && saved.token && subscription) {
        var result = await request('/api/notifications?action=status', saved);
        connected = result.enabled; saved.owner = result.owner || saved.owner; saved.reminderTime = result.reminderTime || '18:00';
        $('notificationOwner').value = saved.owner || ''; $('notificationTime').value = saved.reminderTime; persist();
      }
      setStatus('notificationStatus', !settings.ready ? settings.message : Notification.permission === 'denied' ? '브라우저 설정에서 이 사이트의 알림 차단을 해제해주세요.' : connected ? saved.owner + '님 · ' + saved.reminderTime + ' 알림이 연결되어 있습니다.' : '알림을 받을 본인 이름과 시간을 선택해주세요.');
    }, refreshNotifications);
  });
  $('notificationEnable').addEventListener('click', function () {
    // Request permission immediately in the click gesture, before network work (iOS).
    var permission = connected || Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
    task('notificationStatus', async function () {
      if (await permission !== 'granted') throw new Error('알림이 허용되지 않았습니다. 브라우저 설정에서 변경할 수 있습니다.');
      if (connected) {
        var preferences = await request('/api/notifications?action=preferences', { id: saved.id, token: saved.token, owner: $('notificationOwner').value, reminderTime: $('notificationTime').value });
        saved.owner = preferences.owner; saved.reminderTime = preferences.reminderTime; persist();
        setStatus('notificationStatus', saved.owner + '님 알림을 ' + saved.reminderTime + '로 저장했습니다.');
        return;
      }
      if (!saved.token) {
        var random = crypto.getRandomValues(new Uint8Array(32));
        saved.token = btoa(String.fromCharCode.apply(null, random)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); persist();
      }
      var subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        var key = settings.publicKey.replace(/-/g, '+').replace(/_/g, '/');
        var bytes = Uint8Array.from(atob(key), function (character) { return character.charCodeAt(0); });
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
      }
      var result = await request('/api/notifications?action=subscribe', { token: saved.token, owner: $('notificationOwner').value, reminderTime: $('notificationTime').value, subscription: subscription.toJSON() });
      saved.id = result.id; saved.owner = result.owner; saved.reminderTime = result.reminderTime; persist(); connected = result.enabled;
      setStatus('notificationStatus', saved.owner + '님 알림을 설정했습니다. 알림 시간 ' + saved.reminderTime + '.');
    }, refreshNotifications);
  });
  $('notificationTest').addEventListener('click', function () {
    task('notificationStatus', async function () {
      var result = await request('/api/notifications?action=test', saved);
      if (result.result === 'duplicate') setStatus('notificationStatus', '시험 알림은 1분에 한 번 보낼 수 있습니다.');
      else if (result.result === 'sent') setStatus('notificationStatus', '시험 알림을 발송했습니다. 기기의 알림을 확인해주세요.');
      else throw new Error('알림을 보내지 못했습니다. 기기의 알림 설정을 확인해주세요.');
    }, refreshNotifications);
  });
  $('notificationDisable').addEventListener('click', function () {
    task('notificationStatus', async function () {
      var serverError;
      try { if (saved.id && saved.token) await request('/api/notifications?action=unsubscribe', saved); } catch (error) { serverError = error; }
      var subscription = await registration.pushManager.getSubscription();
      if (subscription && !await subscription.unsubscribe()) throw new Error('기기의 알림 해제에 실패했습니다. 다시 시도해주세요.');
      saved = {}; persist(); connected = false;
      setStatus('notificationStatus', serverError ? '이 기기 알림은 해제했습니다. 서버 연결 기록 정리는 지연될 수 있습니다.' : '이 기기의 알림을 해제했습니다.');
    }, refreshNotifications);
  });
  if (new URLSearchParams(location.search).get('report-reminder') === '1') setActiveView('today', false);
}());
