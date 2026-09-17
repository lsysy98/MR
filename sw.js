self.addEventListener('push', event => {
  let message;
  try { message = event.data.json(); } catch (_) { return; }
  if (!message || message.expiresAt < Date.now()) return;
  event.waitUntil(self.registration.showNotification(message.title || '일일보고', {
    body: message.body || '', tag: message.tag || 'daily-report',
    icon: '/icons/report-192.png', badge: '/icons/report-192.png',
    data: { url: '/?report-reminder=1' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL('/?report-reminder=1', self.location.origin).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  })());
});
// No fetch handler: report data and API responses are never cached offline.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
