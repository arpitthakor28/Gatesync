/* eslint-disable no-undef */
import { precacheAndRoute } from 'workbox-precaching';

// Precache static assets injected by Vite
precacheAndRoute(self.__WB_MANIFEST || []);

const API_BASE = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://gatesync-backend.onrender.com';

// 1. Web Push Event Listener
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'GateSync Alert',
      body: event.data.text()
    };
  }

  const title = payload.title || 'GateSync - Visitor Alert';
  const data = payload.data || payload;
  const requestId = data.requestId || data.id;

  const options = {
    body: payload.body || 'New gate visitor requesting entry confirmation.',
    icon: '/Gatesync/icons/icon-192.png',
    badge: '/Gatesync/icons/icon-192.png',
    image: data.visitorPhotoUrl || undefined,
    tag: data.requestId ? `gate_visitor_${data.requestId}` : 'gatesync_alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 450],
    data: {
      url: `/Gatesync/#/registry?requestId=${requestId || ''}`,
      requestId: requestId,
      type: data.type || 'VISITOR_REQUEST',
      societyId: data.societyId || 'SOC-101',
      flatNumber: data.flatNumber || ''
    },
    actions: [
      { action: 'approve', title: '✓ Approve Entry' },
      { action: 'reject', title: '✕ Deny' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Click & Action Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};
  const requestId = notifData.requestId;

  // Handle direct Approve or Reject action button clicks
  if ((action === 'approve' || action === 'reject') && requestId) {
    const approved = action === 'approve';
    event.waitUntil(
      handleDirectDecision(requestId, approved)
        .then(() => {
          return self.registration.showNotification(
            approved ? '✓ Visitor Entry Approved' : '✕ Visitor Entry Denied',
            {
              body: approved
                ? 'Security guard has been notified to open the gate barrier.'
                : 'Security guard has been informed to deny entry at the gate.',
              icon: '/Gatesync/icons/icon-192.png',
              tag: `gate_visitor_result_${requestId}`,
              timeout: 4000
            }
          );
        })
        .catch((err) => {
          console.error('[SW] Action decision error:', err);
          return focusOrOpenWindow(notifData.url || '/Gatesync/#/registry');
        })
    );
    return;
  }

  // Regular notification click: focus existing window or open deep link
  const targetUrl = notifData.url || '/Gatesync/#/registry';
  event.waitUntil(focusOrOpenWindow(targetUrl));
});

// Focus open GateSync window or open a new one
async function focusOrOpenWindow(targetUrl) {
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of windowClients) {
    if (client.url.includes('/Gatesync/') && 'focus' in client) {
      if ('navigate' in client && targetUrl) {
        client.navigate(targetUrl);
      }
      return client.focus();
    }
  }
  if (clients.openWindow) {
    return clients.openWindow(targetUrl);
  }
}

// Execute decision from service worker via HttpOnly cookie credentials
async function handleDirectDecision(requestId, approved) {
  const endpoint = `${API_BASE}/api/resident/visitor-requests/decision`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: Number(requestId),
        approved: approved,
        denialReason: approved ? null : 'Denied via Quick Notification Action'
      })
    });

    if (res.ok) return await res.json();

    // If 401 Unauthorized, attempt silent refresh using the HttpOnly refresh token cookie
    if (res.status === 401) {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const retryRes = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshData.accessToken}`
          },
          body: JSON.stringify({
            requestId: Number(requestId),
            approved: approved,
            denialReason: approved ? null : 'Denied via Quick Notification Action'
          })
        });
        if (retryRes.ok) return await retryRes.json();
      }
    }
    throw new Error(`Decision API returned status ${res.status}`);
  } catch (e) {
    console.error('[SW] Failed to send decision directly:', e);
    throw e;
  }
}

// Allow immediate activation when a new version is installed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
