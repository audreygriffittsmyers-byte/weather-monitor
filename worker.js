// Atlantic Aviation WATCH — Cloudflare Worker
// Deploy at: https://lucky-flower-26db.audreygriffitts-myers.workers.dev

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, no-cache',
};
const GEOJSON = { ...CORS, 'Content-Type': 'application/json' };
const TEXT    = { ...CORS, 'Content-Type': 'text/plain' };
const UA = 'AtlanticAviation-WATCH/1.0 (ops@atlanticaviation.com)';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url  = new URL(request.url);
    const type = url.searchParams.get('type');

    // ── SPC per-point lookup ──────────────────────────────────────────────────
    if (type === 'spc') {
      const lat = parseFloat(url.searchParams.get('lat'));
      const lon = parseFloat(url.searchParams.get('lon'));
      const day = url.searchParams.get('day') || '1';
      if (isNaN(lat) || isNaN(lon)) return new Response(JSON.stringify({}), { headers: GEOJSON });
      const LAYER = { '1':1, '2':9, '3':17 };
      const TORN  = { '1':3, '2':11 };
      const HAIL  = { '1':5, '2':13 };
      const WIND  = { '1':7, '2':15 };
      const bbox = `${lon-0.25},${lat-0.25},${lon+0.25},${lat+0.25}`;
      const base = 'https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer';
      const qs   = `geometry=${encodeURIComponent(bbox)}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=LABEL,LABEL2,DN&returnGeometry=false&f=json`;
      try {
        const reqs = [fetch(`${base}/${LAYER[day]||1}/query?${qs}`, { headers: { 'User-Agent': UA } })];
        if (TORN[day]) reqs.push(fetch(`${base}/${TORN[day]}/query?${qs}`, { headers: { 'User-Agent': UA } }));
        if (HAIL[day]) reqs.push(fetch(`${base}/${HAIL[day]}/query?${qs}`, { headers: { 'User-Agent': UA } }));
        if (WIND[day]) reqs.push(fetch(`${base}/${WIND[day]}/query?${qs}`, { headers: { 'User-Agent': UA } }));
        const responses = await Promise.all(reqs);
        const [catRes, tornRes, hailRes, windRes] = await Promise.all(responses.map(r => r.json().catch(() => ({}))));
        return new Response(JSON.stringify({ cat: catRes, torn: tornRes||{}, hail: hailRes||{}, wind: windRes||{} }), { headers: GEOJSON });
      } catch(e) {
        return new Response(JSON.stringify({ cat:{}, torn:{}, hail:{}, wind:{} }), { headers: GEOJSON });
      }
    }

    // ── SPC probability polygons ──────────────────────────────────────────────
    if (type === 'spcprobpoly') {
      const layer = url.searchParams.get('layer') || '2';
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${layer}/query?where=1%3D1&outFields=DN&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── SPC categorical polygons ──────────────────────────────────────────────
    if (type === 'spcpoly') {
      const day = url.searchParams.get('day') || '1';
      const LAYER = { '1':1, '2':9, '3':17 };
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${LAYER[day]||1}/query?where=1%3D1&outFields=LABEL,LABEL2,DN&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── SPC outlook text — returns JSON {productText: "..."} ──────────────────
    if (type === 'text') {
      const product = url.searchParams.get('product') || 'PTSDY1';
      const URLS = {
        PTSDY1: 'https://www.spc.noaa.gov/products/outlook/day1otlk.txt',
        PTSDY2: 'https://www.spc.noaa.gov/products/outlook/day2otlk.txt',
        PTSDY3: 'https://www.spc.noaa.gov/products/outlook/day3otlk.txt',
      };
      try {
        const res = await fetch(URLS[product] || URLS.PTSDY1, { headers: { 'User-Agent': UA } });
        const text = await res.text();
        return new Response(JSON.stringify({ productText: text }), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({ productText: '' }), { headers: GEOJSON }); }
    }

    // ── NWS alerts by state ───────────────────────────────────────────────────
    if (type === 'nwspoly') {
      const area = url.searchParams.get('area');
      if (!area) return new Response('Missing area', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://api.weather.gov/alerts/active?area=${area}&status=actual`,
          { headers: { 'User-Agent': UA, 'Accept': 'application/geo+json' } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── SPC Fire Weather polygons ─────────────────────────────────────────────
    if (type === 'firepoly') {
      const day = url.searchParams.get('day') || '1';
      const LAYER = { '1':1, '2':4 };
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/fire_weather/SPC_firewx/MapServer/${LAYER[day]||1}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── WPC Excessive Rainfall polygons ──────────────────────────────────────
    if (type === 'wpcpoly') {
      try {
        const res = await fetch('https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/wpc_precip_hazards/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── WPC Winter Weather polygons ───────────────────────────────────────────
    if (type === 'winterpoly') {
      try {
        const res = await fetch('https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/wpc_precip_hazards/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── METAR aviation weather ────────────────────────────────────────────────
    if (type === 'metar') {
      const icao = url.searchParams.get('icao');
      if (!icao) return new Response('Missing icao', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json&taf=false`,
          { headers: { 'User-Agent': UA } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── TAF aviation forecast ─────────────────────────────────────────────────
    if (type === 'taf') {
      const icao = url.searchParams.get('icao');
      if (!icao) return new Response('Missing icao', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json&metar=false`,
          { headers: { 'User-Agent': UA } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── NOTAMs ────────────────────────────────────────────────────────────────
    if (type === 'notam') {
      const icao = url.searchParams.get('icao');
      if (!icao) return new Response(JSON.stringify([]), { headers: GEOJSON });
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/notam?ids=${icao}&format=json`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── Air Quality Index (AirNow) ────────────────────────────────────────────
    if (type === 'aqi') {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');
      const apiKey = env.AIRNOW_API_KEY;
      if (!apiKey) return new Response(JSON.stringify([]), { headers: GEOJSON });
      try {
        const res = await fetch(`https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 3600, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── Earthquake (USGS) ─────────────────────────────────────────────────────
    if (type === 'earthquake') {
      const start = new Date(Date.now() - 24*60*60*1000).toISOString();
      try {
        const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&minmagnitude=3.0&orderby=magnitude`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── Volcano (USGS VHP) ────────────────────────────────────────────────────
    if (type === 'volcano') {
      try {
        const res = await fetch('https://volcanoes.usgs.gov/vhp/api/alert?format=json',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── Space Weather (NOAA SWPC) ─────────────────────────────────────────────
    if (type === 'spaceweather') {
      try {
        const res = await fetch('https://services.swpc.noaa.gov/products/alerts.json',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── Wildfire Perimeters (NIFC) ────────────────────────────────────────────
    if (type === 'wildfirepoly') {
      try {
        const res = await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query?where=PolygonDateTime+>=+CURRENT_TIMESTAMP+-+7&outFields=attr_IncidentName,attr_GISAcres,attr_FireBehaviorGeneral&returnGeometry=true&outSR=4326&f=geojson&resultRecordCount=500',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── NHC Active Storms ─────────────────────────────────────────────────────
    if (type === 'nhc') {
      try {
        const res = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: CORS });
      } catch(e) { return new Response(JSON.stringify({activeStorms:[]}), { headers: CORS }); }
    }

    // ── NHC Forecast Cone ─────────────────────────────────────────────────────
    if (type === 'nhccone') {
      const stormId = url.searchParams.get('id');
      if (!stormId) return new Response('Missing id', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://www.nhc.noaa.gov/storm_graphics/api/${stormId}_5day_pgn.json`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    // ── Tropical Outlook Text (NHC) ───────────────────────────────────────────
    if (type === 'tropicaloutlook') {
      try {
        const res = await fetch('https://www.nhc.noaa.gov/text/MIATWOAT.shtml',
          { headers: { 'User-Agent': UA } });
        const html = await res.text();
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        return new Response(match ? match[1] : '', { headers: TEXT });
      } catch(e) { return new Response('', { headers: TEXT }); }
    }

    // ── FAA NAS Status (GDP/GS/AFP) ───────────────────────────────────────────
    if (type === 'nas') {
      try {
        const res = await fetch('https://nasstatus.faa.gov/api/airport-status-information',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        const xml = await res.text();
        const programs = [];
        const tag = (str, t) => (str.match(new RegExp('<' + t + '>(.*?)</' + t + '>')) || [])[1] || '';
        for (const m of xml.matchAll(/<Ground_Delay_Program>([\s\S]*?)<\/Ground_Delay_Program>/g)) {
          const b = m[1]; const arpt = tag(b,'ARPT');
          if (arpt) programs.push({ type:'GDP', arpt:arpt.trim(), reason:tag(b,'Reason').trim(), avg:tag(b,'Avg').trim(), max:tag(b,'Max').trim() });
        }
        for (const m of xml.matchAll(/<Ground_Stop_Program>([\s\S]*?)<\/Ground_Stop_Program>/g)) {
          const b = m[1]; const arpt = tag(b,'ARPT');
          if (arpt) programs.push({ type:'GS', arpt:arpt.trim(), reason:tag(b,'Reason').trim(), end:tag(b,'End_Time').trim() });
        }
        for (const m of xml.matchAll(/<AFP>([\s\S]*?)<\/AFP>/g)) {
          const b = m[1]; const arpt = tag(b,'ARPT');
          if (arpt) programs.push({ type:'AFP', arpt:arpt.trim(), reason:tag(b,'Reason').trim() });
        }
        return new Response(JSON.stringify(programs), { headers: { ...GEOJSON, 'Cache-Control': 'public, max-age=300' } });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    // ── Satellite tile proxy (GOES via nowCOAST WMS) ──────────────────────────
    if (type === 'satellite') {
      const z = url.searchParams.get('z');
      const x = url.searchParams.get('x');
      const y = url.searchParams.get('y');
      const rawLayer = url.searchParams.get('layer') || 'global_longwave_imagery_mosaic';
      const layer = rawLayer.includes(':') ? rawLayer : 'satellite:' + rawLayer;
      const WMS = 'https://nowcoast.noaa.gov/geoserver/observations/satellite/ows';
      const zi = parseInt(z), xi = parseInt(x), yi = parseInt(y);
      const tileSize = 20037508.34 * 2 / Math.pow(2, zi);
      const minX = xi * tileSize - 20037508.34;
      const maxX = minX + tileSize;
      const maxY = 20037508.34 - yi * tileSize;
      const minY = maxY - tileSize;
      const bbox = `${minX},${minY},${maxX},${maxY}`;
      const wmsUrl = `${WMS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${layer}&STYLES=&CRS=EPSG:3857&BBOX=${bbox}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=TRUE`;
      try {
        const res = await fetch(wmsUrl, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        const img = await res.arrayBuffer();
        return new Response(img, { headers: { ...CORS, 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' } });
      } catch(e) {
        return new Response(null, { status: 204, headers: CORS });
      }
    }

    // ── AI Plain-Language Briefing ────────────────────────────────────────────
    if (type === 'brief') {
      const body = await request.json().catch(() => ({}));
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500, headers: GEOJSON });
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: body.messages || [] }),
        });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: GEOJSON }); }
    }

    // ── Push notification relay ───────────────────────────────────────────────
    if (type === 'notify') {
      return new Response(JSON.stringify({ ok: true }), { headers: GEOJSON });
    }

    if (type === 'tfr') {
      try {
        const res = await fetch('https://tfr.faa.gov/tfr2/list.html',
          { headers: { 'User-Agent': UA }, cf: { cacheEverything: false } });
        const html = await res.text();
        const tfrs = [];
        // Parse HTML table rows
        const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let row;
        while ((row = rowRe.exec(html)) !== null) {
          const cells = [];
          let cell;
          const cr = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          while ((cell = cr.exec(row[1])) !== null) {
            cells.push(cell[1].replace(/<[^>]+>/g,'').trim());
          }
          if (cells.length >= 5 && cells[1] && cells[1].includes('/')) {
            tfrs.push({ notam_id:cells[1], facility:cells[2], state:cells[3], type:cells[4], description:(cells[5]||'').substring(0,200) });
          }
        }
        return new Response(JSON.stringify(tfrs), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers: GEOJSON });
  }
};
