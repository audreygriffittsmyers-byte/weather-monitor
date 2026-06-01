// WATCH Service Worker v2 -- PWA + Push Notifications
const CACHE_NAME = 'watch-v2';
const CACHE_URLS = [
  '/weather-monitor/AtlanticWATCH.html',
  '/weather-monitor/manifest.json',
  '/weather-monitor/icon-192.png',
  '/weather-monitor/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS).catch(function(err) {
        console.log('WATCH SW: cache prefill partial', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return clients.claim(); })
  );
});

// ── Fetch: cache-first for app shell, network-first for API ──────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Always network-first for API/weather data
  if (url.includes('workers.dev') || url.includes('api.weather.gov') ||
      url.includes('aviationweather') || url.includes('nhc.noaa.gov')) {
    return; // let browser handle
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() { return cached; });
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'WATCH Alert', {
      body: data.body || 'New weather alert at an Atlantic location.',
      icon: '/weather-monitor/icon-192.png',
      badge: '/weather-monitor/icon-192.png',
      tag: data.tag || 'watch-alert',
      requireInteraction: data.urgency === 'high',
      data: { url: data.url || '/weather-monitor/AtlanticWATCH.html' }
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/weather-monitor/AtlanticWATCH.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes('weather-monitor')) return list[i].focus();
      }
      return clients.openWindow(target);
    })
  );
});

// ── Periodic background sync ──────────────────────────────────────────────────
self.addEventListener('periodicsync', function(e) {
  if (e.tag === 'watch-alert-check') {
    e.waitUntil(checkAlertsBackground());
  }
});

async function checkAlertsBackground() {
  try {
    var cache = await caches.open(CACHE_NAME);
    var knownResp = await cache.match('known-alerts');
    var knownIds = new Set();
    if (knownResp) { var arr = await knownResp.json(); arr.forEach(function(id){ knownIds.add(id); }); }

    var resp = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert&severity=Extreme,Severe&limit=50',
      { headers: { 'User-Agent': 'WATCH-SW/2.0' } });
    if (!resp.ok) return;
    var data = await resp.json();
    var newAlerts = (data.features || []).filter(function(f){ return !knownIds.has(f.id); });

    if (newAlerts.length > 0) {
      var allIds = [...knownIds, ...newAlerts.map(function(f){ return f.id; })].slice(-200);
      await cache.put('known-alerts', new Response(JSON.stringify(allIds)));
      var props = newAlerts[0].properties || {};
      await self.registration.showNotification('⚠ WATCH: ' + (props.event || 'New Alert'), {
        body: (props.headline || '').substring(0, 120),
        icon: '/weather-monitor/icon-192.png',
        tag: 'watch-bg-alert',
        requireInteraction: true,
        data: { url: '/weather-monitor/AtlanticWATCH.html' }
      });
    }
  } catch(e) {}
}
