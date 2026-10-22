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
  var suppressContactUntil = 0;
  var lastContactAt = 0;
  var viewed = false;

  function uid() {
    try { return crypto.randomUUID(); } catch (e) {}
    return 'e' + Date.now() + Math.random().toString(36).slice(2);
  }

  function cookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
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

  function track(name, params, eventId, userData) {
    try {
      if (window.fbq) {
        if (eventId) window.fbq('track', name, params || {}, { eventID: eventId });
        else window.fbq('track', name, params || {});
      }
    } catch (e) {}
    if (eventId) sendServerEvent(name, params, eventId, userData);
  }

  function lead(info) {
    info = info || {};
    var eventId = uid();
    suppressContactUntil = Date.now() + 4000;
    var params = {};
    if (info.content_name) params.content_name = String(info.content_name);
    if (info.source) params.lead_source = String(info.source);
    track('Lead', params, eventId, info.user_data);
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
  }

  function contact(method) {
    var now = Date.now();
    if (now < suppressContactUntil || now - lastContactAt < 1500) return;
    lastContactAt = now;
    track('Contact', { contact_method: method }, uid());
  }

  track('PageView', {}, uid());

  document.addEventListener('click', function (event) {
    try {
      var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      var href = anchor.getAttribute('href') || '';
      if (WA.test(href)) contact('whatsapp');
      else if (/^tel:/i.test(href)) contact('phone');
    } catch (e) {}
  }, true);

  var nativeOpen = window.open;
  window.open = function (url) {
    try { if (typeof url === 'string' && WA.test(url)) contact('whatsapp'); } catch (e) {}
    return nativeOpen.apply(window, arguments);
  };

  window.eurekaTrack = { lead: lead, viewTrip: viewTrip, contact: contact };
})();
