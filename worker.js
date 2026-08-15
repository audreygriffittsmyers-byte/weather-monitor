// Atlantic Aviation WATCH — Cloudflare Worker

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const GEOJSON = { ...CORS, 'Content-Type': 'application/json' };
const TEXT    = { ...CORS, 'Content-Type': 'text/plain' };
const UA = 'AtlanticAviation-WATCH/1.0 (ops@atlanticaviation.com)';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url  = new URL(request.url);
    const type = url.searchParams.get('type');

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

    if (type === 'spcprobpoly') {
      const layer = url.searchParams.get('layer') || '2';
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${layer}/query?where=1%3D1&outFields=DN&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'tstmprobe') {
      // Diagnostic only. spc.noaa.gov blocks the assistant's tooling, so ask the
      // Worker to list what the experimental Thunderstorm Outlook page actually
      // publishes instead of guessing at filenames.
      const PAGES = [
        'https://www.spc.noaa.gov/products/exper/enhtstm/',
        'https://www.spc.noaa.gov/gis/'
      ];
      const out = {};
      for (const p of PAGES) {
        try {
          const r = await fetch(p, { headers: { 'User-Agent': UA } });
          const body = r.ok ? await r.text() : '';
          const hrefs = [];
          const re = /href\s*=\s*["']([^"']+)["']/gi;
          let m;
          while ((m = re.exec(body)) !== null) hrefs.push(m[1]);
          const gis = hrefs.filter(function (h) {
            return /\.(zip|kml|kmz|geojson|json|shp|nc)(\?|$)/i.test(h)
                || /tstm|thunder|enhtstm/i.test(h) && /gis|shape|kml|download/i.test(h);
          });
          out[p] = { status: r.status, totalLinks: hrefs.length, gisLinks: gis.slice(0, 40) };
        } catch (e) { out[p] = { error: String(e) }; }
      }
      return new Response(JSON.stringify(out, null, 1), { headers: GEOJSON });
    }

    if (type === 'spcpoly') {
      const day = url.searchParams.get('day') || '1';
      const LAYER = { '1':1, '2':9, '3':17 };
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${LAYER[day]||1}/query?where=1%3D1&outFields=LABEL,LABEL2,DN&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

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

    if (type === 'nwspoly') {
      const area = url.searchParams.get('area');
      if (!area) return new Response('Missing area', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://api.weather.gov/alerts/active?area=${area}&status=actual`,
          { headers: { 'User-Agent': UA, 'Accept': 'application/geo+json' } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'activefire') {
      try {
        // NIFC WFIGS current fire perimeters -- large fires updated twice daily
        const res = await fetch(
          'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=GISAcres%3E100&outFields=IncidentName,GISAcres,DiscoveryAcres,PercentContained,ModifiedOnDateTime_dt&returnGeometry=true&outSR=4326&f=geojson&resultRecordCount=200',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } }
        );
        if (!res.ok) return new Response(JSON.stringify({features:[]}), { headers: GEOJSON });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'firepoly') {
      const day = url.searchParams.get('day') || '1';
      const LAYER = { '1':1, '2':4 };
      try {
        const res = await fetch(`https://mapservices.weather.noaa.gov/vector/rest/services/fire_weather/SPC_firewx/MapServer/${LAYER[day]||1}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'wpcpoly') {
      try {
        const res = await fetch('https://mapservices.weather.noaa.gov/vector/rest/services/hazards/wpc_precip_hazards/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'winterpoly') {
      try {
        const res = await fetch('https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/wpc_wssi/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'nearbymetar') {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');
      if (!lat || !lon) return new Response('Missing lat/lon', { status: 400, headers: CORS });
      try {
        // Step 1: get nearest obs stations via NWS points API
        const ptRes = await fetch(`https://api.weather.gov/points/${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`,
          { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
        if (!ptRes.ok) return new Response('[]', { headers: CORS });
        const pt = await ptRes.json();
        const obsUrl = pt.properties?.observationStations;
        if (!obsUrl) return new Response('[]', { headers: CORS });
        // Step 2: get ordered list of nearest stations
        const stRes = await fetch(obsUrl, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
        if (!stRes.ok) return new Response('[]', { headers: CORS });
        const stData = await stRes.json();
        const icaos = (stData.features || []).slice(0, 5).map(f => f.properties.stationIdentifier).filter(Boolean);
        if (!icaos.length) return new Response('[]', { headers: CORS });
        // Step 3: fetch METARs for those stations
        const metarRes = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icaos.join(',')}&format=json&taf=false`,
          { headers: { 'User-Agent': UA }, cf: { cacheEverything: false } });
        if (!metarRes.ok) return new Response('[]', { headers: CORS });
        return new Response(await metarRes.text(), { headers: CORS });
      } catch(e) { return new Response('[]', { headers: CORS }); }
    }

    if (type === 'metar') {
      const icao = url.searchParams.get('icao');
      if (!icao) return new Response('Missing icao', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json&taf=false`,
          { headers: { 'User-Agent': UA }, cf: { cacheEverything: false } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

    if (type === 'taf') {
      const icao = url.searchParams.get('icao');
      if (!icao) return new Response('Missing icao', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json&metar=false`,
          { headers: { 'User-Agent': UA }, cf: { cacheEverything: false } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }

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

    if (type === 'aqiforecast') {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');
      const apiKey = env.AIRNOW_API_KEY;
      if (!apiKey) return new Response(JSON.stringify([]), { headers: GEOJSON });
      try {
        const res = await fetch(`https://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${apiKey}`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 21600, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify([]), { headers: GEOJSON }); }
    }




    // Visual Crossing Timeline -- fills the forecast gap at international sites
    // (no NWS coverage) and supplies derived comfort metrics for cross-checking.
    // Requests only the elements WATCH actually renders, to hold record count down.
    if (type === 'vcx') {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');
      const apiKey = env.VISUALCROSSING_API_KEY;
      if (!apiKey || !lat || !lon) return new Response(JSON.stringify({ error: 'unavailable' }), { headers: GEOJSON });
      const ELEMENTS = 'datetime,datetimeEpoch,temp,feelslike,humidity,dew,precipprob,preciptype,windspeed,windgust,winddir,conditions,severerisk';
      const qs = new URLSearchParams({
        key: apiKey, unitGroup: 'us', include: 'hours,current,alerts',
        elements: ELEMENTS, contentType: 'json'
      });
      try {
        const res = await fetch(
          `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/today/tomorrow?${qs}`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 1800, cacheEverything: true } });
        if (!res.ok) return new Response(JSON.stringify({ error: 'upstream', status: res.status }), { headers: GEOJSON });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({ error: 'fetch_failed' }), { headers: GEOJSON }); }
    }

    if (type === 'wildfirepoly') {
      try {
        const res = await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query?where=PolygonDateTime+>=+CURRENT_TIMESTAMP+-+7&outFields=attr_IncidentName,attr_GISAcres,attr_FireBehaviorGeneral&returnGeometry=true&outSR=4326&f=geojson&resultRecordCount=500',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify({features:[]}), { headers: GEOJSON }); }
    }

    if (type === 'nhcdisturbances') {
      // NHC Graphical Tropical Weather Outlook (GTWO).
      // Layer 3 = Seven-Day: Potential Development Region (polygons)
      // Layer 2 = Seven-Day: Current Location (points)
      // Both services expose identical GTWO layer IDs; try summary first, fall back.
      const TWQ = '/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson';
      const SERVICES = [
        ['summary', 'https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather_summary/MapServer'],
        ['full',    'https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather/MapServer'],
      ];
      const dbg = [];
      const out = { type: 'FeatureCollection', features: [] };
      for (const [tag, base] of SERVICES) {
        try {
          const [rArea, rPt] = await Promise.all([
            fetch(base + '/3' + TWQ, { headers:{'User-Agent':UA}, cf:{cacheTtl:600, cacheEverything:true} }),
            fetch(base + '/2' + TWQ, { headers:{'User-Agent':UA}, cf:{cacheTtl:600, cacheEverything:true} }),
          ]);
          let area = { features: [] }, pts = { features: [] };
          try { if (rArea.ok) area = await rArea.json(); } catch(e) {}
          try { if (rPt.ok)   pts  = await rPt.json();  } catch(e) {}
          const af = area.features || [], pf = pts.features || [];
          dbg.push({ svc: tag, areaStatus: rArea.status, areaCount: af.length, ptStatus: rPt.status, ptCount: pf.length });
          if (af.length || pf.length) {
            af.forEach(function(f){ f.properties = f.properties || {}; f.properties._kind = 'area';  out.features.push(f); });
            pf.forEach(function(f){ f.properties = f.properties || {}; f.properties._kind = 'point'; out.features.push(f); });
            out._src = tag;
            break;
          }
        } catch(e) { dbg.push({ svc: tag, error: String(e) }); }
      }
      out._debug = dbg;
      return new Response(JSON.stringify(out), { headers: GEOJSON });
    }

    if (type === 'nhc') {
      try {
        const res = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json',
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
        return new Response(await res.text(), { headers: CORS });
      } catch(e) { return new Response(JSON.stringify({activeStorms:[]}), { headers: CORS }); }
    }

    if (type === 'nhcgis') {
      const bin = (url.searchParams.get('bin') || '').toUpperCase();
      const BASE = { AT1:4, AT2:30, AT3:56, AT4:82, AT5:108, EP1:134, EP2:160, EP3:186, EP4:212, EP5:238, CP1:264, CP2:290, CP3:316, CP4:342, CP5:368 };
      const b = BASE[bin];
      const empty = { points:{features:[]}, track:{features:[]}, cone:{features:[]} };
      if (b == null) return new Response(JSON.stringify(empty), { headers: GEOJSON });
      const svc = 'https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather/MapServer';
      const q = (layerId) => fetch(`${svc}/${layerId}/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson`,
        { headers: { 'User-Agent': UA }, cf: { cacheTtl: 300, cacheEverything: true } });
      try {
        const [ptRes, trkRes, coneRes] = await Promise.all([ q(b+2), q(b+3), q(b+4) ]);
        const points = ptRes.ok   ? await ptRes.json()   : {features:[]};
        const track  = trkRes.ok  ? await trkRes.json()  : {features:[]};
        const cone   = coneRes.ok ? await coneRes.json() : {features:[]};
        return new Response(JSON.stringify({ points, track, cone }), { headers: GEOJSON });
      } catch(e) { return new Response(JSON.stringify(empty), { headers: GEOJSON }); }
    }

    if (type === 'nwsproduct') {
      // The products API indexes by 3-char product code + 4-char issuing office,
      // passed as QUERY params on /products. SWODY1 is the full AWIPS ID, not a
      // type -- /products/types/SWODY1 and /types/SWO/locations/WNS both return
      // an empty @graph, which is what every previous attempt was hitting.
      const PRODUCTS = {
        // wmo is the reliable discriminator: one code+office covers several
        // products (SWO/KWNS carries the Day 1/2/3 outlooks AND mesoscale
        // discussions, which are ACUS11 and are issued far more often).
        SWODY1: { code: 'SWO', office: 'KWNS', wmo: 'ACUS01', match: /convective\s*outlook/i },
        QPFERD: { code: 'QPF', office: 'KWBC', wmo: 'FOUS30', match: /excessive\s*rainfall/i },
        PMDSPD: { code: 'PMD', office: 'KWBC', wmo: 'FXUS01', match: /short\s*range/i },
      };
      const code = (url.searchParams.get('code') || '').toUpperCase();
      const spec = PRODUCTS[code];
      if (!spec) return new Response(JSON.stringify({ text: '', error: 'unsupported product' }), { headers: CORS });
      try {
        // Query the WMO id directly. Filtering a type+office listing failed because
        // SPC issues dozens of mesoscale discussions (ACUS11) a day under the same
        // SWO/KWNS pair, so the Day 1 outlook (ACUS01) fell outside the window.
        const listUrl = `https://api.weather.gov/products?wmoid=${spec.wmo}&office=${spec.office}&limit=5`;
        const listRes = await fetch(listUrl, { headers: { 'User-Agent': UA } });
        const diag = { listUrl, listStatus: listRes.status };
        if (!listRes.ok) {
          return new Response(JSON.stringify({ text: '', error: 'listing failed', diag }), { headers: CORS });
        }
        const listJson = await listRes.json();
        const graph = listJson['@graph'] || [];
        diag.count = graph.length;
        diag.names = graph.slice(0, 5).map(g => (g.wmoCollectiveId || '?') + ' ' + g.productName);
        if (!graph.length) {
          const altUrl = `https://api.weather.gov/products?type=${spec.code}&office=${spec.office}&limit=50`;
          const altRes = await fetch(altUrl, { headers: { 'User-Agent': UA } });
          diag.altUrl = altUrl; diag.altStatus = altRes.status;
          if (altRes.ok) {
            const altJson = await altRes.json();
            const altGraph = (altJson['@graph'] || []).filter(g => (g.wmoCollectiveId || '').toUpperCase().startsWith(spec.wmo));
            diag.altCount = altGraph.length;
            if (altGraph.length) graph.push(altGraph[0]);
          }
        }
        if (!graph.length) {
          return new Response(JSON.stringify({ text: '', error: 'no product found', diag }), { headers: CORS });
        }
        // One office+code can cover several products (SWO covers Day 1/2/3 and
        // mesoscale discussions), so match on product name and fall back to newest.
        const pick = graph.find(g => (g.wmoCollectiveId || '').toUpperCase().startsWith(spec.wmo)) || graph[0];
        diag.picked = pick.productName;
        // /products returns a bare UUID in `id`; the resolvable URL is in `@id`.
        const prodUrl = pick['@id'] || `https://api.weather.gov/products/${pick.id}`;
        diag.prodUrl = prodUrl;
        const prodRes = await fetch(prodUrl, { headers: { 'User-Agent': UA } });
        if (!prodRes.ok) {
          return new Response(JSON.stringify({ text: '', error: 'product fetch failed', diag }), { headers: CORS });
        }
        const prodJson = await prodRes.json();
        return new Response(JSON.stringify({
          text: prodJson.productText || '',
          issuanceTime: prodJson.issuanceTime || null,
          productName: prodJson.productName || null
        }), { headers: CORS });
      } catch(e) { return new Response(JSON.stringify({ text: '', error: e.message }), { headers: CORS }); }
    }

    if (type === 'tropicaloutlook') {
      try {
        const basin = url.searchParams.get('basin') || 'at';
        const products = { at:'MIATWOAT', ep:'MIATWOEP', cp:'HFOTWOCP' };
        const prod = products[basin] || 'MIATWOAT';
        const res = await fetch(`https://www.nhc.noaa.gov/text/${prod}.shtml`,
          { headers: { 'User-Agent': UA } });
        const html = await res.text();
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        return new Response(match ? match[1] : '', { headers: TEXT });
      } catch(e) { return new Response('', { headers: TEXT }); }
    }
    if (type === 'caribwx') {
      // Caribbean offshore waters forecast -- covers BDA, GCM, SXM, PLS region
      const product = url.searchParams.get('product') || 'MIAOFFNT2';
      const ALLOWED = ['MIAOFFNT2','MIAOFFNT1','MIAHSFAT1','MIATWOAT'];
      if (!ALLOWED.includes(product)) return new Response('Invalid product', { status: 400, headers: CORS });
      try {
        const res = await fetch(`https://www.nhc.noaa.gov/text/${product}.shtml`,
          { headers: { 'User-Agent': UA }, cf: { cacheTtl: 3600, cacheEverything: true } });
        const html = await res.text();
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        return new Response(JSON.stringify({ text: match ? match[1].trim() : '', product }), { headers: CORS });
      } catch(e) { return new Response(JSON.stringify({ text: '', product }), { headers: CORS }); }
    }

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







    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers: GEOJSON });
  }
};
