/* =====================================================================
   GROUP TRIP CARD (.tc2) — shared renderer
   =====================================================================
   Builds the richer ".tc2" trip card (photo gallery, multi-tag with a
   "+N" overflow popover, trending badge, route, dates, location, price)
   used in two places:
     - index.html's "Social group trips for ages 21-39s" section
     - group-trip.html's "Choose Your Travel Tribe" section

   These used to be two separately-maintained copies that had drifted
   apart — different HTML structure, different escaping (one page HTML-
   escaped every field, the other didn't), a missing location line and
   WhatsApp fallback on one of the two, and different default colors/
   sizes for the same CSS variables. This file is now the single source
   of truth for that card, built by combining the more complete
   structure with the safer escaping — so both pages render identically
   and can't drift apart again.

   Requires `esc()` and `openWA()` to already be defined on the page
   (both index.html and group-trip.html already define these).
   ===================================================================== */

var BL = {adventure:"Adventure", beach:"Beach", culture:"Culture", nature:"Nature", solo:"Solo", nightlife:"Nightlife"};
var TAG_EMOJI = {adventure:'🚀', beach:'🏖️', culture:'🎭', nature:'🌿', solo:'🎒', nightlife:'🎉'};

function buildGroupTripCardHTML(t) {
  var allTags = [];
  if (t.hot) allTags.push({ hot: true, label: '🔥 Hot' });
  (t.tags || []).forEach(function(rawTagRaw) {
    var rawTag = rawTagRaw || '';
    var tagKey = rawTag.toLowerCase().trim();
    var label = TAG_EMOJI[tagKey] ? (TAG_EMOJI[tagKey] + ' ' + (BL[tagKey] || rawTag)) : esc(rawTag);
    allTags.push({ hot: false, label: label });
  });
  var shownTags = allTags.slice(0, 3);
  var extraTags = allTags.slice(3);
  var tags = shownTags.map(function(tg) {
    return '<span class="tc2-tag' + (tg.hot ? ' tc2-tag-hot' : '') + '">' + tg.label + '</span>';
  }).join('');
  if (extraTags.length > 0) {
    var popoverHtml = extraTags.map(function(tg) {
      return '<span class="tc2-tag' + (tg.hot ? ' tc2-tag-hot' : '') + '">' + tg.label + '</span>';
    }).join('');
    tags += '<span class="tc2-tag tc2-tag-more" onclick="event.stopPropagation();tc2ToggleTags(this)">+' + extraTags.length + '<div class="tc2-tag-popover">' + popoverHtml + '</div></span>';
  }

  var dStr = esc((t.dates || []).join(' | '));
  var pr = (t.price || 0).toLocaleString('en-IN');
  var msg = 'Hi EUREKA Trips! I am interested in "' + (t.name || '') + '". Can you share details and available dates?';
  var clickAction = t.page ? ("window.open('" + esc(t.page) + "','_blank','noopener')") : ("openWA('" + msg.replace(/'/g, "&#39;") + "')");
  var gallery = (t.gallery && t.gallery.length) ? t.gallery : [t.img];
  var galJson = esc(JSON.stringify(gallery));

  var out = '';
  out += '<div class="tc2 fu" onclick="' + clickAction + '">';
  out += '<div class="tc2-img" data-gallery=\'' + galJson + '\' data-idx="0">';
  if (t.trending) {
    out += '<div class="tc2-trending-badge"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 11-14h-7z"/></svg>Trending</div>';
  }
  out += '<img width="800" height="600" src="' + esc(gallery[0]) + '" alt="' + esc(t.name || '') + '" loading="lazy" decoding="async">';
  if (gallery.length > 1) {
    out += '<button type="button" class="tc2-gal-arrow tc2-gal-prev" aria-label="Previous photo" onclick="event.stopPropagation();tc2GalNav(this,-1)"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>';
    out += '<button type="button" class="tc2-gal-arrow tc2-gal-next" aria-label="Next photo" onclick="event.stopPropagation();tc2GalNav(this,1)"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>';
    out += '<div class="tc2-gal-dots">';
    for (var k = 0; k < gallery.length; k++) out += '<span class="tc2-gal-dot' + (k === 0 ? ' active' : '') + '"></span>';
    out += '</div>';
  }
  out += '</div>';
  out += '<div class="tc2-body">';
  out += '<div class="tc2-tags">' + tags + '</div>';
  out += '<div class="tc2-name">' + esc(t.name || '') + '</div>';
  out += '<div class="tc2-route">' + esc(t.route || '') + '</div>';
  out += '<div class="tc2-foot">';
  out += '<div class="tc2-foot-left"><div class="tc2-dates">' + dStr + '</div><div class="tc2-dur">' + esc(t.dur || '') + '</div>';
  if (t.location) out += '<div class="tc2-loc">' + esc(t.location) + '</div>';
  out += '</div>';
  out += '<div class="tc2-foot-right"><div class="tc2-price-lbl">per person</div><div class="tc2-price">' + pr + '</div></div>';
  out += '</div>';
  out += '</div></div>';
  return out;
}

// Photo-gallery prev/next inside a card.
function tc2GalNav(btn, dir) {
  var wrap = btn.closest('.tc2-img');
  if (!wrap) return;
  var gallery;
  try { gallery = JSON.parse(wrap.getAttribute('data-gallery') || '[]'); } catch (e) { gallery = []; }
  if (!gallery.length || gallery.length <= 1) return;
  var idx = parseInt(wrap.getAttribute('data-idx') || '0', 10);
  idx = (idx + dir + gallery.length) % gallery.length;
  wrap.setAttribute('data-idx', idx);
  var img = wrap.querySelector('img');
  if (img) img.src = gallery[idx];
  var dots = wrap.querySelectorAll('.tc2-gal-dot');
  dots.forEach(function (d, j) { d.classList.toggle('active', j === idx); });
}

// "+N" tag overflow popover.
function tc2ToggleTags(el) {
  var pop = el.querySelector('.tc2-tag-popover');
  if (!pop) return;
  var wasOpen = pop.classList.contains('open');
  document.querySelectorAll('.tc2-tag-popover.open').forEach(function (p) { p.classList.remove('open'); });
  if (!wasOpen) pop.classList.add('open');
}
document.addEventListener('click', function (e) {
  if (!e.target.closest('.tc2-tag-more')) {
    document.querySelectorAll('.tc2-tag-popover.open').forEach(function (p) { p.classList.remove('open'); });
  }
});
