// WATCH Service Worker -- Atlantic Aviation
// Handles background push notifications and periodic alert checks

const CACHE_NAME = 'watch-v1';
const PROXY = 'https://lucky-flower-26db.audreygriffitts-myers.workers.dev';

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// ── Push event (from server-sent push) ───────────────────────────────────────
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  var title   = data.title   || 'WATCH Alert';
  var body    = data.body    || 'New weather alert at an Atlantic location.';
  var tag     = data.tag     || 'watch-alert';
  var urgency = data.urgency || 'normal';
  e.waitUntil(
    self.registration.showNotification(title, {
      body:  body,
      icon:  '/weather-monitor/icon-192.png',
      badge: '/weather-monitor/icon-192.png',
      tag:   tag,
      requireInteraction: urgency === 'high',
      data:  { url: data.url || '/weather-monitor/' }
    })
  );
});

// ── Notification click -- open WATCH ─────────────────────────────────────────
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/weather-monitor/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes('weather-monitor')) {
          return list[i].focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});

// ── Periodic background sync (Android Chrome only) ───────────────────────────
// Fires every ~15 min when page is closed, checks for new SEVERE/EXTREME alerts
self.addEventListener('periodicsync', function(e) {
  if (e.tag === 'watch-alert-check') {
    e.waitUntil(checkForNewAlertsBackground());
  }
});

// Track known alert IDs in cache to avoid duplicate notifications
async function checkForNewAlertsBackground() {
  try {
    // Get previously known alert IDs from cache storage
    var cache = await caches.open(CACHE_NAME);
    var knownResp = await cache.match('known-alerts');
    var knownIds = new Set();
    if (knownResp) {
      var knownArr = await knownResp.json();
      knownArr.forEach(function(id) { knownIds.add(id); });
    }

    // Fetch alerts for a sample of high-traffic locations
    // Full scan would be too slow -- SW fetches NWS summary endpoint
    var resp = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert&severity=Extreme,Severe&limit=50', {
      headers: { 'User-Agent': 'WATCH-ServiceWorker/1.0' }
    });
    if (!resp.ok) return;
    var data = await resp.json();
    var features = data.features || [];

    var newAlerts = features.filter(function(f) {
      return !knownIds.has(f.id);
    });

    if (newAlerts.length > 0) {
      // Save updated known IDs
      var allIds = [...knownIds, ...newAlerts.map(function(f){ return f.id; })];
      // Keep only last 200
      if (allIds.length > 200) allIds = allIds.slice(-200);
      await cache.put('known-alerts', new Response(JSON.stringify(allIds)));

      // Show notification for worst alert
      var worst = newAlerts[0];
      var props = worst.properties || {};
      await self.registration.showNotification('⚠ WATCH: ' + (props.event || 'New Alert'), {
        body: (props.headline || props.description || '').substring(0, 120),
        icon: '/weather-monitor/icon-192.png',
        tag:  'watch-bg-alert',
        requireInteraction: true,
        data: { url: '/weather-monitor/' }
      });
    }
  } catch(err) {
    // Silent fail -- background checks are best-effort
    console.log('WATCH SW background check failed:', err);
  }
}
