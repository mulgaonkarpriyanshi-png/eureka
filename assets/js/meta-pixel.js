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
fbq('track', 'PageView');

/* Eureka Trips browser events. No form PII is sent as event parameters. */
(function () {
  var WA = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i;
  var suppressContactUntil = 0;
  var lastContactAt = 0;
  var viewed = false;

  function uid() {
    try { return crypto.randomUUID(); } catch (e) {}
    return 'e' + Date.now() + Math.random().toString(36).slice(2);
  }

  function track(name, params, eventId) {
    try {
      if (!window.fbq) return;
      if (eventId) window.fbq('track', name, params || {}, { eventID: eventId });
      else window.fbq('track', name, params || {});
    } catch (e) {}
  }

  function lead(info) {
    info = info || {};
    var eventId = uid();
    suppressContactUntil = Date.now() + 4000;
    var params = {};
    if (info.content_name) params.content_name = String(info.content_name);
    if (info.source) params.lead_source = String(info.source);
    track('Lead', params, eventId);
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
