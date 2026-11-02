/* Eureka Trips: sends page views, time on page, button clicks and form leads to the Eureka DM Admin dashboard.
   Add AFTER assets/js/meta-pixel.js on every page:  <script src="assets/js/eureka-dm-track.js" defer></script> */
(function () {
  var URL_ = 'https://sfdgfjvswxojomhvtwin.supabase.co/functions/v1/quick-processor?web=1';
  var KEY = 'AFAEQn2F4Y4RcJvoc6GHjD35EONWjEdN';
  var WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i;
  function uid() { try { return crypto.randomUUID(); } catch (e) {} return 'v' + Date.now() + Math.random().toString(36).slice(2); }
  function store(area, k) { try { var s = window[area]; var v = s.getItem(k); if (!v) { v = uid(); s.setItem(k, v); } return v; } catch (e) { return uid(); } }
  var vid = store('localStorage', 'eureka_vid'), sid = store('sessionStorage', 'eureka_sid');
  var qs = new URLSearchParams(location.search);
  function attr() { try { return (window.eurekaTrack && window.eurekaTrack.attribution && window.eurekaTrack.attribution()) || {}; } catch (e) { return {}; } }
  function base(type) {
    var a = attr();
    return { type: type, vid: vid, sid: sid, page: location.pathname, ref: document.referrer || '',
      utm_source: a.utm_source || qs.get('utm_source') || '', utm_medium: a.utm_medium || qs.get('utm_medium') || '',
      utm_campaign: a.utm_campaign || qs.get('utm_campaign') || '', utm_content: a.utm_content || qs.get('utm_content') || '',
      ad_id: qs.get('ad_id') || a.utm_id || qs.get('utm_id') || '' };
  }
  function send(payload, beacon) {
    payload.key = KEY;
    var body = JSON.stringify(payload);
    try {
      if (beacon && navigator.sendBeacon && navigator.sendBeacon(URL_, new Blob([body], { type: 'text/plain' }))) return;
      fetch(URL_, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body: body }).catch(function () {});
    } catch (e) {}
  }
  function ev(type, extra, beacon) { var e = base(type); for (var k in (extra || {})) e[k] = extra[k]; send({ events: [e] }, beacon); }

  // 1. Page view
  ev('view');

  // 2. Time on page: counts only while the tab is visible and the visitor is active
  var secs = 0, lastActive = Date.now();
  ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(function (n) { window.addEventListener(n, function () { lastActive = Date.now(); }, { passive: true }); });
  setInterval(function () { if (!document.hidden && Date.now() - lastActive < 30000) secs += 5; }, 5000);
  var lastSent = 0;
  function ping(beacon) { if (secs > lastSent) { lastSent = secs; ev('ping', { secs: secs }, beacon); } }
  setInterval(function () { ping(false); }, 15000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) ping(true); });
  window.addEventListener('pagehide', function () { ping(true); });

  // 3. Button clicks (label = whatsapp / call / enquiry / other button text)
  var lastKey = '', lastAt = 0;
  document.addEventListener('click', function (event) {
    try {
      var el = event.target && event.target.closest ? event.target.closest('a[href],button') : null;
      if (!el) return;
      var href = el.getAttribute('href') || '', text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
      var label = WA.test(href) ? 'whatsapp' : /^tel:/i.test(href) ? 'call' : text;
      if (!label) return;
      var k = label + '|' + location.pathname, now = Date.now();
      if (k === lastKey && now - lastAt < 1000) return;
      lastKey = k; lastAt = now;
      ev('click', { label: label }, true);
    } catch (e) {}
  }, true);

  // 4. Form leads: copies every lead the site already saves into the dashboard (Leads tab, source "Website")
  function sendLead(info) {
    try {
      info = info || {}; var u = info.user_data || {}, a = base('form');
      var lead = { name: u.name || '', phone: u.phone || '', email: u.email || '', city: u.city || '', trip: info.content_name || info.trip_name || '', message: u.message || info.message || '',
        page: location.pathname, vid: vid, sid: sid, utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, utm_content: a.utm_content };
      if (!lead.phone && !lead.email) return;
      send({ lead: lead }, false);
    } catch (e) {}
  }
  function wrap() {
    var t = window.eurekaTrack; if (!t || t.__dm) return false; t.__dm = true;
    ['lead', 'itineraryDownload'].forEach(function (fn) {
      var orig = t[fn]; if (typeof orig !== 'function') return;
      t[fn] = function (info) { var r = orig.apply(this, arguments); sendLead(info); return r; };
    });
    return true;
  }
  if (!wrap()) { var tries = 0, iv = setInterval(function () { if (wrap() || ++tries > 40) clearInterval(iv); }, 250); }
})();
