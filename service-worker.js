// WATCH Service Worker v3 -- Network-first for HTML, cache for static assets
const CACHE_NAME = 'watch-v3';
const STATIC_ASSETS = [
  '/weather-monitor/manifest.json',
  '/weather-monitor/icon-192.png',
  '/weather-monitor/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
];

// ── Install: cache only static assets, NOT the HTML ──────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.log('WATCH SW: partial cache', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clear ALL old caches ───────────────────────────────────────────
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

// ── Fetch: ALWAYS network-first for HTML, cache-first for static only ─────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // API calls -- always network, no caching
  if (url.includes('workers.dev') || url.includes('api.weather.gov') ||
      url.includes('aviationweather') || url.includes('nhc.noaa.gov') ||
      url.includes('weather.gov') || url.includes('openweathermap')) {
    return;
  }

  // HTML -- always network-first, fall back to cache if offline
  if (url.includes('AtlanticWATCH.html') || url.endsWith('/weather-monitor/') || url.endsWith('/weather-monitor')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        // Update cache with fresh version
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() {
        // Offline fallback
        return caches.match(e.request);
      })
    );
    return;
  }

  // Static assets -- cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        }
        return resp;
      });
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

// ── Notification click -- open WATCH at specific location ─────────────────────
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
  if (e.tag === 'watch-alert-check') e.waitUntil(checkAlertsBackground());
});

async function checkAlertsBackground() {
  try {
    var cache = await caches.open(CACHE_NAME);
    var knownResp = await cache.match('known-alerts');
    var knownIds = new Set();
    if (knownResp) { var arr = await knownResp.json(); arr.forEach(function(id){ knownIds.add(id); }); }
    var resp = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert&severity=Extreme,Severe&limit=50',
      { headers: { 'User-Agent': 'WATCH-SW/3.0' } });
    if (!resp.ok) return;
    var data = await resp.json();
    var newAlerts = (data.features || []).filter(function(f){ return !knownIds.has(f.id); });
    if (newAlerts.length > 0) {
      var allIds = [...knownIds, ...newAlerts.map(function(f){ return f.id; })].slice(-200);
      await cache.put('known-alerts', new Response(JSON.stringify(allIds)));
      var props = newAlerts[0].properties || {};
      await self.registration.showNotification('WATCH: ' + (props.event || 'New Alert'), {
        body: (props.headline || '').substring(0, 120),
        icon: '/weather-monitor/icon-192.png',
        tag: 'watch-bg-alert',
        requireInteraction: true,
        data: { url: '/weather-monitor/AtlanticWATCH.html' }
      });
    }
  } catch(e) {}
}
