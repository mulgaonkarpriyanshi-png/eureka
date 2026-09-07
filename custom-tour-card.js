/* =====================================================================
   CUSTOM TOUR CARD — shared renderer
   =====================================================================
   Builds the ".ctc-card" trip card used in two places:
     - index.html's "Our featured tours" section
     - custom-trips.html's "Choose Your Travel Tribe" and "More Trips
       You'll Love" sections
   Both read from the same `custom_tour_cards` Supabase table. They used
   to have two separately-maintained copies of this card template, which
   had drifted apart over time (missing the photo gallery, the star
   rating, and the route line on one of the two pages). This file is now
   the single source of truth for that markup, so both pages render an
   identical card and can never drift apart again — update the template
   here once and both pages pick it up.

   Requires `esc()` and `openWA()` to already be defined on the page
   (both index.html and custom-trips.html already define these).
   ===================================================================== */

function buildCustomTourCardHTML(r) {
  var page = 'trip-page.html?trip=' + esc(r.page_slug || r.id);
  var tag = (r.tag_emoji ? esc(r.tag_emoji) : '');
  var tagLabel = esc(r.tag_label || '');
  var waMsg = 'Hi EUREKA Trips! I want to build a custom trip — "' + (r.title || '') + '". Can someone call me back?';
  var gallery = (r.gallery_images && r.gallery_images.length) ? r.gallery_images : (r.image_url ? [r.image_url] : []);
  var galJson = esc(JSON.stringify(gallery));

  var out = '';
  out += '<div class="ctc-card fu" onclick="window.location.href=\'' + page + '\'">';
  out += '<div class="ctc-img" data-gallery=\'' + galJson + '\' data-idx="0">';
  out += '<img width="800" height="600" src="' + esc(gallery[0] || '') + '" alt="' + esc(r.title || '') + '" loading="lazy">';
  if (gallery.length > 1) {
    out += '<button type="button" class="ctc-gal-arrow ctc-gal-prev" aria-label="Previous photo" onclick="event.stopPropagation();ctcGalNav(this,-1)"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>';
    out += '<button type="button" class="ctc-gal-arrow ctc-gal-next" aria-label="Next photo" onclick="event.stopPropagation();ctcGalNav(this,1)"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>';
    out += '<div class="ctc-gal-dots">';
    for (var k = 0; k < gallery.length; k++) out += '<span class="ctc-gal-dot' + (k === 0 ? ' active' : '') + '"></span>';
    out += '</div>';
  }
  out += '</div>';
  out += '<div class="ctc-panel">';
  out += '<div class="ctc-toprow">';
  if (tagLabel.trim()) out += '<div class="ctc-tag">' + (tag ? '<span class="ctc-tag-icon">' + tag + '</span>' : '') + '<span>' + tagLabel + '</span></div>';
  if (r.rating) out += '<div class="ctc-rating-inline"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.8l-6.1 3.2 1.5-6.8-5.2-4.7 6.9-.7z"/></svg>' + esc(r.rating) + '</div>';
  out += '</div>';
  out += '<div class="ctc-title">' + esc(r.title || '') + '</div>';
  out += '<div class="ctc-foot">';
  out += '<div class="ctc-foot-left"><div class="ctc-dur" title="' + esc(r.duration_label || 'Flexible duration') + '">' + esc(r.duration_label || 'Flexible duration') + '</div>';
  if (r.location_text) out += '<div class="ctc-route" title="' + esc(r.location_text) + '">' + esc(r.location_text) + '</div>';
  out += '</div>';
  out += '<div class="ctc-foot-right"><div class="ctc-price-lbl">for Adult/-</div><div class="ctc-price">' + esc(r.price_text || '') + '</div></div>';
  out += '</div>';
  out += '<div class="ctc-actions" onclick="event.stopPropagation()">';
  out += '<a href="tel:+919792496457" class="ctc-call-icon" aria-label="Call us"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>';
  out += '<button class="ctc-callback-btn" data-ts="ctc_button_text" onclick="openWA(\'' + waMsg.replace(/'/g, "&#39;") + '\')">Request Callback</button>';
  out += '</div></div></div>';
  return out;
}

// Photo-gallery prev/next inside a card — shared by every card built above.
function ctcGalNav(btn, dir) {
  var wrap = btn.closest('.ctc-img');
  if (!wrap) return;
  var gallery;
  try { gallery = JSON.parse(wrap.getAttribute('data-gallery') || '[]'); } catch (e) { gallery = []; }
  if (!gallery.length || gallery.length <= 1) return;
  var idx = parseInt(wrap.getAttribute('data-idx') || '0', 10);
  idx = (idx + dir + gallery.length) % gallery.length;
  wrap.setAttribute('data-idx', idx);
  var img = wrap.querySelector('img');
  if (img) img.src = gallery[idx];
  var dots = wrap.querySelectorAll('.ctc-gal-dot');
  dots.forEach(function (d, j) { d.classList.toggle('active', j === idx); });
}
