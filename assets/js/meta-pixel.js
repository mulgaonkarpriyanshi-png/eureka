!function(f,b,e,v,n,t,s){
  if(f.fbq)return;
  n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;
  n.push=n;
  n.loaded=!0;
  n.version='2.0';
  n.queue=[];
  t=b.createElement(e);
  t.async=!0;
  t.src=v;
  s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s);
}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '222456587607172');

/* Eureka Trips browser events. No form PII is sent as event parameters. */
(function () {
  var WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i;
  var CAPI_URL = 'https://caigrloiymgfxubzprbg.supabase.co/functions/v1/meta-conversions';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhaWdybG9peW1nZnh1YnpwcmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTM1MjksImV4cCI6MjA5ODk2OTUyOX0.zA5Q1kAAk66fgX_Ertnrbb4TJmM5yPE71zy-alK-yqE';
  var GA4_ID = window.EUREKA_GA4_ID || '';
  var ATTR_KEY = 'eureka_attribution_v1';
  var ATTR_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'fbclid'];
  var suppressContactUntil = 0;
  var lastContactAt = 0;
  var lastButtonKey = '';
  var lastButtonAt = 0;
  var viewed = false;

  function uid() {
    try { return crypto.randomUUID(); } catch (e) {}
    return 'e' + Date.now() + Math.random().toString(36).slice(2);
  }

  function cookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function captureAttribution() {
    var params = new URLSearchParams(window.location.search);
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(ATTR_KEY) || '{}') || {}; } catch (e) {}
    var found = false;
    ATTR_FIELDS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        saved[key] = value.slice(0, 500);
        found = true;
      }
    });
    if (found) {
      if (!saved.first_landing_page) saved.first_landing_page = location.href.slice(0, 1000);
      if (!saved.first_referrer) saved.first_referrer = document.referrer.slice(0, 1000);
      if (!saved.first_landed_at) saved.first_landed_at = new Date().toISOString();
      saved.last_landing_page = location.href.slice(0, 1000);
      saved.last_landed_at = new Date().toISOString();
      try { localStorage.setItem(ATTR_KEY, JSON.stringify(saved)); } catch (e) {}
    }
    return saved;
  }

  var attributionData = captureAttribution();

  function attribution() {
    var data = {};
    ATTR_FIELDS.forEach(function (key) {
      if (attributionData[key]) data[key] = attributionData[key];
    });
    return data;
  }

  function loadGA4() {
    if (!/^G-[A-Z0-9]+$/i.test(GA4_ID)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID, { send_page_view: true });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    document.head.appendChild(script);
  }

  function ga4(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }

  function elementPosition(element) {
    if (!element) return 'unknown';
    if (element.dataset && element.dataset.trackPosition) return element.dataset.trackPosition;
    var section = element.closest && element.closest('section,header,footer,aside');
    if (!section) return 'page';
    return section.id || (section.className ? String(section.className).split(/\s+/)[0] : '') || section.tagName.toLowerCase();
  }

  function sendServerEvent(name, params, eventId, userData) {
    var payload = {
      event_name: name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: location.href,
      user_agent: navigator.userAgent,
      fbp: cookie('_fbp'),
      fbc: cookie('_fbc'),
      custom_data: params || {},
      user_data: userData || {}
    };
    try {
      fetch(CAPI_URL, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: 'Bearer ' + SB_KEY
        },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  function normalizePhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return '+91' + digits;
    if (digits.length === 12 && digits.indexOf('91') === 0) return '+' + digits;
    return digits ? '+' + digits : '';
  }

  function storeLead(info, eventId) {
    info = info || {};
    var user = info.user_data || {};
    var payload = Object.assign({
      event_id: eventId,
      source_form: info.source || 'website_form',
      name: String(user.name || '').trim(),
      phone: normalizePhone(user.phone),
      email: String(user.email || '').trim().toLowerCase(),
      trip: String(info.content_name || '').trim(),
      page: location.href.split('?')[0],
      referrer: document.referrer || ''
    }, attribution());
    if (!payload.name && !payload.phone && !payload.email) return;
    try {
      fetch('https://caigrloiymgfxubzprbg.supabase.co/rest/v1/website_form_leads', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: 'Bearer ' + SB_KEY,
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  function track(name, params, eventId, userData) {
    try {
      if (window.fbq) {
        if (eventId) window.fbq('track', name, params || {}, { eventID: eventId });
        else window.fbq('track', name, params || {});
      }
    } catch (e) {}
    if (eventId) sendServerEvent(name, params, eventId, userData);
  }

  function trackCustom(name, params) {
    var eventId = uid();
    try {
      if (window.fbq) window.fbq('trackCustom', name, params || {}, { eventID: eventId });
    } catch (e) {}
    sendServerEvent(name, params, eventId);
    return eventId;
  }

  function lead(info) {
    info = info || {};
    var eventId = uid();
    suppressContactUntil = Date.now() + 4000;
    var params = {};
    if (info.content_name) params.content_name = String(info.content_name);
    if (info.source) params.lead_source = String(info.source);
    track('Lead', params, eventId, info.user_data);
    storeLead(info, eventId);
    ga4('form_submit', {
      form_name: info.source || 'website_form',
      trip_name: info.content_name || '',
      page_location: location.href
    });
    return eventId;
  }

  function viewTrip(trip) {
    if (viewed || !trip) return;
    viewed = true;
    var params = { content_type: 'product', currency: 'INR' };
    if (trip.id !== undefined && trip.id !== null) params.content_ids = [String(trip.id)];
    if (trip.title) params.content_name = String(trip.title);
    var price = Number(trip.price);
    if (price > 0) params.value = price;
    track('ViewContent', params, uid());
    ga4('view_item', {
      currency: 'INR',
      value: price > 0 ? price : undefined,
      items: [{ item_id: trip.id == null ? '' : String(trip.id), item_name: trip.title || 'Trip' }]
    });
  }

  function contact(method, info) {
    var now = Date.now();
    if (now < suppressContactUntil || now - lastContactAt < 1500) return;
    lastContactAt = now;
    info = info || {};
    var params = { contact_method: method, page: location.pathname, button_position: info.position || 'unknown' };
    track('Contact', params, uid());
    ga4(method === 'phone' ? 'call_click' : 'whatsapp_click', {
      page_location: location.href,
      button_position: params.button_position
    });
  }

  function itineraryDownload(info) {
    info = info || {};
    var params = {
      content_name: info.trip_name || '',
      file_name: info.file_name || 'full-itinerary',
      lead_source: 'itinerary_download'
    };
    trackCustom('ItineraryDownload', params);
    storeLead({
      source: 'itinerary_download',
      content_name: params.content_name,
      user_data: info.user_data || {}
    }, uid());
    ga4('itinerary_download', {
      trip_name: params.content_name,
      file_name: params.file_name,
      page_location: location.href
    });
  }

  function buttonClick(element) {
    if (!element) return;
    var label = (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    if (!label) return;
    var key = label + '|' + location.pathname;
    var now = Date.now();
    if (key === lastButtonKey && now - lastButtonAt < 1000) return;
    lastButtonKey = key;
    lastButtonAt = now;
    var params = { button_label: label, page: location.pathname, button_position: elementPosition(element) };
    trackCustom('ButtonClick', params);
    ga4('button_click', {
      button_label: label,
      page_location: location.href,
      button_position: params.button_position
    });
  }

  loadGA4();
  track('PageView', { page_path: location.pathname }, uid());

  document.addEventListener('click', function (event) {
    try {
      var clicked = event.target && event.target.closest ? event.target.closest('a[href],button') : null;
      if (!clicked) return;
      var href = clicked.getAttribute('href') || '';
      if (WA.test(href)) contact('whatsapp', { position: elementPosition(clicked) });
      else if (/^tel:/i.test(href)) contact('phone', { position: elementPosition(clicked) });
      else buttonClick(clicked);
    } catch (e) {}
  }, true);

  var nativeOpen = window.open;
  window.open = function (url) {
    try { if (typeof url === 'string' && WA.test(url)) contact('whatsapp', { position: 'scripted_action' }); } catch (e) {}
    return nativeOpen.apply(window, arguments);
  };

  window.eurekaTrack = {
    lead: lead,
    viewTrip: viewTrip,
    contact: contact,
    itineraryDownload: itineraryDownload,
    buttonClick: buttonClick,
    attribution: attribution,
    ga4: ga4
  };
})();
