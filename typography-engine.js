/* =====================================================================
   TYPOGRAPHY ENGINE — single shared source of truth
   =====================================================================
   Include this ONE file on every page (admin.html + all public pages)
   instead of each page carrying its own copy of this logic. It powers
   two independent features, both driven by the `typography_styles`
   Supabase table:

   1) WHOLE-FIELD styles
      An element tagged data-ts="some_key" is styled entirely from
      whichever style was picked in Settings for that key.
      → TypographyEngine.applyAllTagged()

   2) PER-SELECTION "pen" styles
      Inside a Quill rich-text editor in the admin panel, highlighting
      a few words and picking a style from the Desktop/Mobile dropdown
      tags just that span with class tsd-<id> (desktop) or tsm-<id>
      (mobile, wrapped in a max-width:768px media query).
      → TypographyEngine.richTextField() / initEditors() / applyPen()

   THE BUG THIS FIXES
   -------------------
   Previously, the CSS for .tsd-<id> / .tsm-<id> was only generated and
   injected on public pages (index.html etc.) — admin.html never
   injected it at all. That meant applying a pen style in the admin
   editor could never visibly change the text there (no CSS existed on
   that page to render it), even when the tag itself had been applied
   correctly. That silent mismatch — "it doesn't look like it worked,
   so I assume it didn't" — is what this rewrite removes: both admin
   and public pages now build that CSS from the exact same function,
   so what you see in the editor is what ships.

   It also fixes a silent no-op: previously, picking a style with no
   text highlighted did absolutely nothing and told the user nothing.
   That now shows a clear error toast instead.
   ===================================================================== */

(function (global) {
  'use strict';

  // -------------------------------------------------------------------
  // 0. ENVIRONMENT ADAPTER
  //    admin.html defines sbFetch(table, params); public pages define
  //    sbGet(table, params). Both return a Promise<Array>. Rather than
  //    add a THIRD slightly-different copy of that fetch logic, this
  //    engine just calls whichever one is already on the page.
  // -------------------------------------------------------------------
  function sbList(table, params) {
    if (typeof global.sbFetch === 'function') return global.sbFetch(table, params); // admin.html
    if (typeof global.sbGet === 'function')   return global.sbGet(table, params);   // public pages
    console.error('[TypographyEngine] Neither sbFetch nor sbGet is defined on this page.');
    return Promise.resolve([]);
  }

  function notify(msg, type) {
    // Only the admin panel has a toast UI. On public pages this is a no-op.
    if (typeof global.toast === 'function') global.toast(msg, type);
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------------------
  // 1. LOAD + CACHE typography_styles (shared by both features above)
  // -------------------------------------------------------------------
  var STYLES_BY_ID = { desktop: {}, mobile: {} };   // id -> style row, for lookups
  var STYLES_LIST  = { desktop: [], mobile: [] };   // ordered list, for dropdown menus
  var loadPromise = null;

  function loadStyles(forceReload) {
    if (loadPromise && !forceReload) return loadPromise;
    loadPromise = Promise.resolve(sbList('typography_styles', 'order=name.asc')).then(function (rows) {
      rows = Array.isArray(rows) ? rows : [];
      STYLES_BY_ID = { desktop: {}, mobile: {} };
      STYLES_LIST  = { desktop: [], mobile: [] };
      rows.forEach(function (st) {
        if (st.scope !== 'desktop' && st.scope !== 'mobile') return;
        STYLES_BY_ID[st.scope][String(st.id)] = st;
        STYLES_LIST[st.scope].push(st);
      });
      injectCSS(rows);
      return rows;
    }).catch(function (err) {
      console.error('[TypographyEngine] Failed to load typography_styles', err);
      return [];
    });
    return loadPromise;
  }

  // -------------------------------------------------------------------
  // 2. CSS GENERATION — the ONE place declarations are built from a
  //    style row. Used identically on every page, admin included, so
  //    the editor preview and the live site can never drift apart.
  // -------------------------------------------------------------------
  function declarationsFor(style) {
    var decl = '';
    if (style.font_family) decl += 'font-family:' + style.font_family + ';';
    if (Number(style.font_size) > 0) decl += 'font-size:' + style.font_size + 'px;';
    if (style.font_weight) decl += 'font-weight:' + style.font_weight + ';';
    if (Number(style.line_height) > 0) decl += 'line-height:' + style.line_height + 'px;';
    if (style.color) decl += 'color:' + style.color + ';';
    if (style.text_align) decl += 'text-align:' + style.text_align + ';display:block;';
    return decl;
  }

  function injectCSS(rows) {
    var css = '';
    rows.forEach(function (st) {
      var decl = declarationsFor(st);
      if (!decl) return;
      if (st.scope === 'desktop') {
        css += '.tsd-' + st.id + '{' + decl + '}';
      } else {
        css += '@media(max-width:768px){.tsm-' + st.id + '{' + decl + '}}';
        // Forced override for the admin Preview Mode toggle (section 4.5) — lets
        // a mobile-scoped pen style be seen instantly at any actual window width,
        // via body.ts-preview-mobile, without needing an @media match. Harmless
        // on public pages: that body class is only ever added by the toggle,
        // which only mounts in the admin panel.
        css += 'body.ts-preview-mobile .tsm-' + st.id + '{' + decl + '}';
      }
    });
    var el = document.getElementById('tsInlineStylesCSS');
    if (!el) { el = document.createElement('style'); el.id = 'tsInlineStylesCSS'; document.head.appendChild(el); }
    el.textContent = css;
  }

  // -------------------------------------------------------------------
  // 3. WHOLE-FIELD ENGINE (data-ts="key")
  // -------------------------------------------------------------------
  var CURRENT_SETTINGS = {};
  function setCurrentSettings(s) { CURRENT_SETTINGS = s || {}; }

  // Admin-only "preview mode" — see section 4.5 below. Left as 'auto' (real
  // viewport width decides) everywhere except when the admin toggle forces
  // a scope, so this has zero effect on public pages, which never call
  // setPreviewScope().
  var previewScope = 'auto'; // 'auto' | 'desktop' | 'mobile'
  function isMobileViewport() {
    if (previewScope === 'mobile') return true;
    if (previewScope === 'desktop') return false;
    return global.matchMedia('(max-width:768px)').matches;
  }

  function applyTagged(el) {
    var key = el && el.dataset ? el.dataset.ts : null;
    if (!key) return;
    var scope = isMobileViewport() ? 'mobile' : 'desktop';
    var id = CURRENT_SETTINGS[key + '_style_' + scope];
    var style = id ? STYLES_BY_ID[scope][id] : null;

    el.style.fontFamily = ''; el.style.fontSize = ''; el.style.fontWeight = '';
    el.style.lineHeight = ''; el.style.color = ''; el.style.textAlign = '';
    el.style.justifyContent = ''; el.style.alignItems = '';
    if (!style) return; // no style picked for this field/scope — keep the site's built-in look

    if (style.font_family) el.style.fontFamily = style.font_family;
    if (Number(style.font_size) > 0) el.style.fontSize = style.font_size + 'px';
    if (style.font_weight) el.style.fontWeight = style.font_weight;
    if (Number(style.line_height) > 0) el.style.lineHeight = style.line_height + 'px';
    if (style.color) el.style.color = style.color;
    if (style.text_align) {
      el.style.textAlign = style.text_align;
      // text-align has no effect on flex containers (icon+text rows, tag pills, etc.
      // are common site-wide) — map to the flex equivalent instead.
      var computed = global.getComputedStyle(el);
      if (computed.display === 'flex' || computed.display === 'inline-flex') {
        var map = { left: 'flex-start', center: 'center', right: 'flex-end', justify: 'space-between' };
        var mapped = map[style.text_align];
        if (mapped) {
          if (computed.flexDirection.indexOf('column') === 0) el.style.alignItems = mapped;
          else el.style.justifyContent = mapped;
        }
      }
    }
  }

  function applyAllTagged() {
    document.querySelectorAll('[data-ts]').forEach(applyTagged);
  }

  var resizeTimer = null;
  global.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyAllTagged, 150);
  });

  // -------------------------------------------------------------------
  // 4. PER-SELECTION "PEN" ENGINE (Quill editors, admin panel only)
  // -------------------------------------------------------------------
  var richEditors = {};    // id -> Quill instance
  var lastSelection = {};  // id -> { index, length } — the most recent
                            // NON-EMPTY highlight, kept even after focus
                            // moves to the dropdown (which would otherwise
                            // clear Quill's own notion of "current" selection)
  var formatsRegistered = false;

  function registerFormats() {
    if (formatsRegistered || typeof Quill === 'undefined') return;
    var Parchment = Quill.import('parchment');
    Quill.register(new Parchment.Attributor.Class('tsstyled', 'tsd', { scope: Parchment.Scope.INLINE }), true);
    Quill.register(new Parchment.Attributor.Class('tsstylem', 'tsm', { scope: Parchment.Scope.INLINE }), true);
    formatsRegistered = true;
  }

  // Builds the toolbar + editable box markup for one rich-text field.
  // `id` must be unique within whatever modal/page it's rendered into.
  function richTextField(label, id, value, hint) {
    var toolbarId = 'toolbar-' + id;
    var toolbarHtml =
      '<div class="rt-toolbar-row">' +
        '<div id="' + toolbarId + '">' +
          '<span class="ql-formats"><select class="ql-header"><option value="1"></option><option value="2"></option><option selected></option></select></span>' +
          '<span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button><button class="ql-link"></button></span>' +
          '<span class="ql-formats"><button class="ql-list" value="ordered"></button><button class="ql-list" value="bullet"></button></span>' +
          '<span class="ql-formats"><button class="ql-clean"></button></span>' +
        '</div>' +
        '<select class="ts-active-select" id="tsselD-' + id + '" onchange="TypographyEngine.applyPen(\'' + id + '\',\'desktop\',this.value)"><option value="">\uD83D\uDDA5\uFE0F Desktop\u2026</option></select>' +
        '<select class="ts-active-select" id="tsselM-' + id + '" onchange="TypographyEngine.applyPen(\'' + id + '\',\'mobile\',this.value)"><option value="">\uD83D\uDCF1 Mobile\u2026</option></select>' +
      '</div>';
    return '<div class="fg full"><label>' + escHtml(label) + '</label>' + toolbarHtml +
      '<div class="rich-editor" data-richid="' + id + '" style="background:white">' + (value || '') + '</div>' +
      (hint ? '<div class="hint">' + hint + '</div>' : '') +
      '<div class="hint">Highlight text, then use the Desktop/Mobile dropdowns above to tint just that selection — the change appears live, right in this box. You still need to click this field\u2019s Save button below to persist it.</div></div>';
  }

  // Wires up every not-yet-initialized .rich-editor box currently in the
  // DOM into a live Quill instance. Safe to call repeatedly (e.g. once
  // per modal open / tab switch) — already-initialized editors are skipped.
  function initEditors() {
    registerFormats();
    return loadStyles().then(function () {
      document.querySelectorAll('.rich-editor[data-richid]').forEach(function (el) {
        var id = el.getAttribute('data-richid');
        if (richEditors[id]) return;          // already wired up
        if (el.offsetParent === null) return; // hidden tab — wired up lazily once shown

        var toolbarEl = document.getElementById('toolbar-' + id);
        var q = new Quill(el, { theme: 'snow', modules: { toolbar: { container: toolbarEl } } });
        richEditors[id] = q;

        q.on('selection-change', function (range) {
          if (range && range.length > 0) lastSelection[id] = range;
          reflectActiveStyle(id, range);
        });
        q.on('text-change', function () {
          reflectActiveStyle(id, q.getSelection());
        });

        fillDropdown('tsselD-' + id, STYLES_LIST.desktop);
        fillDropdown('tsselM-' + id, STYLES_LIST.mobile);
      });
    });
  }

  function fillDropdown(selectId, styles) {
    var sel = document.getElementById(selectId);
    if (!sel || sel.options.length > 1) return; // already populated
    styles.forEach(function (st) {
      var o = document.createElement('option');
      o.value = st.id; o.textContent = st.name;
      sel.appendChild(o);
    });
  }

  // Keeps the Desktop/Mobile dropdowns showing whatever pen style is
  // actually applied wherever the cursor currently is — exactly like the
  // built-in "Normal"/H1/H2 dropdown next to them already behaves. Called
  // on every selection move and every edit, so it always reflects the
  // paragraph/word the cursor is in right now, not just the last thing
  // you applied.
  function reflectActiveStyle(id, range) {
    var fmt = range ? richEditors[id].getFormat(range.index, range.length) : {};
    setDropdownState('tsselD-' + id, fmt.tsstyled, STYLES_BY_ID.desktop);
    setDropdownState('tsselM-' + id, fmt.tsstylem, STYLES_BY_ID.mobile);
  }

  function setDropdownState(selectId, styleId, byId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    var valid = styleId && byId[String(styleId)];
    sel.value = valid ? String(styleId) : '';
    sel.title = valid ? 'Currently applied here: ' + byId[String(styleId)].name : 'No style applied here — showing the site\u2019s default look';
    // A faint highlight on the dropdown itself makes "something non-default
    // is active right here" visible at a glance, without needing to open it.
    sel.style.background = valid ? '#E6F7F6' : '';
    sel.style.fontWeight = valid ? '700' : '';
  }

  // Applies (or clears, if styleId is '') a pen style to the last
  // highlighted selection in editor `id`. Called by the Desktop/Mobile
  // <select> onchange handlers built in richTextField() above.
  function applyPen(id, scope, styleId) {
    var q = richEditors[id];
    if (!q) return;

    var range = lastSelection[id];
    if (!range || range.length === 0) {
      reflectActiveStyle(id, q.getSelection());
      notify('Nothing is highlighted in that box — click-drag over some text first, then pick a style.', 'error');
      return;
    }

    var formatName = scope === 'desktop' ? 'tsstyled' : 'tsstylem';
    q.formatText(range.index, range.length, formatName, styleId || false, 'user');
    q.setSelection(range.index, range.length, 'silent'); // keep the same text selected after applying, instead of losing it
    reflectActiveStyle(id, range); // dropdowns now show the style that's actually active on this selection

    flashEditor(id);
    notify('Style applied — you can see it change right in the box now. Click Save to keep it.', 'success');
  }

  // Clear, hard-to-miss visual confirmation right on the editor box itself —
  // the color/font change alone can be subtle, and the toast disappears in a
  // few seconds, so this gives an unmistakable "yes, that worked" moment.
  function flashEditor(id) {
    var container = document.querySelector('.rich-editor[data-richid="' + id + '"]');
    if (!container) return;
    container.style.transition = 'box-shadow .15s ease-out';
    container.style.boxShadow = '0 0 0 3px #02A9A2';
    setTimeout(function () {
      container.style.transition = 'box-shadow .7s ease-in';
      container.style.boxShadow = 'none';
    }, 250);
  }

  // Reads the current HTML out of an editor (what a Save button should send).
  function valueOf(id) {
    if (richEditors[id]) return richEditors[id].root.innerHTML;
    var el = document.querySelector('.rich-editor[data-richid="' + id + '"]');
    return el ? el.innerHTML : '';
  }

  // Call before re-rendering a modal/tab that will build fresh .rich-editor
  // boxes, so old Quill instances (and their selection memory) are dropped.
  function resetEditors() {
    richEditors = {};
    lastSelection = {};
  }

  // -------------------------------------------------------------------
  // 4.5 ADMIN PREVIEW-MODE TOGGLE
  //    A mobile-scoped style only ever shows through an ACTUAL sub-768px
  //    browser window — that's what "mobile" means on the live site. In
  //    the admin panel that means: unless you've physically shrunk the
  //    window, a perfectly-saved mobile edit looks like nothing happened,
  //    while a desktop edit (which has no such width gate) always shows.
  //    That mismatch — desktop "always works", mobile "sometimes doesn't"
  //    — is exactly the confusing behaviour this section removes.
  //
  //    This floating toggle forces the admin page to render AS IF it were
  //    at that width, instantly, using the body.ts-preview-mobile CSS
  //    already generated in injectCSS() above — no separate preview
  //    system to keep in sync, no resizing anything. It only ever mounts
  //    in the admin panel (detected via the presence of sbFetch/toast,
  //    which only admin.html defines), so it never appears on public
  //    pages.
  // -------------------------------------------------------------------
  function applyPreviewBodyClass() {
    document.body.classList.toggle('ts-preview-mobile', previewScope === 'mobile');
  }

  function setPreviewScope(scope) {
    previewScope = scope; // 'auto' | 'desktop' | 'mobile'
    applyPreviewBodyClass();
    applyAllTagged();
    updatePreviewToggleUI();
  }

  function updatePreviewToggleUI() {
    var wrap = document.getElementById('tsPreviewToggle');
    if (!wrap) return;
    wrap.querySelectorAll('button').forEach(function (btn) {
      var active = btn.getAttribute('data-scope') === previewScope;
      btn.style.background = active ? '#02A9A2' : 'transparent';
      btn.style.color = active ? '#fff' : '#b8b8b8';
    });
  }

  function mountPreviewToggle() {
    if (document.getElementById('tsPreviewToggle')) return;
    var wrap = document.createElement('div');
    wrap.id = 'tsPreviewToggle';
    wrap.title = 'Preview the admin panel as if it were this width — lets you see mobile pen/typography styles without resizing your browser.';
    wrap.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99998;background:#1c1c1c;border-radius:30px;padding:4px;display:flex;gap:2px;box-shadow:0 4px 16px rgba(0,0,0,.35);font-family:"Poppins",sans-serif;font-size:12px;font-weight:600';
    [['auto', '\u21C4 Actual size'], ['desktop', '\uD83D\uDDA5\uFE0F Desktop'], ['mobile', '\uD83D\uDCF1 Mobile']].forEach(function (pair) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-scope', pair[0]);
      btn.textContent = pair[1];
      btn.style.cssText = 'border:none;border-radius:24px;padding:7px 12px;cursor:pointer;background:transparent;color:#b8b8b8;transition:background .15s,color .15s';
      btn.addEventListener('click', function () { setPreviewScope(pair[0]); });
      wrap.appendChild(btn);
    });
    document.body.appendChild(wrap);
    updatePreviewToggleUI();
  }

  // Only mount in the admin panel — sbFetch/toast are admin.html globals,
  // defined later in that page's own <body> script, so this check has to
  // wait for DOMContentLoaded too (this file loads in <head>, before
  // admin.html has had a chance to define them).
  function mountPreviewToggleIfAdmin() {
    if (typeof global.sbFetch === 'function' || typeof global.toast === 'function') mountPreviewToggle();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPreviewToggleIfAdmin);
  } else {
    mountPreviewToggleIfAdmin();
  }

  // -------------------------------------------------------------------
  // 5. DEBUG PANEL — add ?ts_debug=1 to any page's URL to see, live,
  //    whether every data-ts field and every tsd-/tsm- span currently
  //    on the page resolves to a real, loaded style.
  // -------------------------------------------------------------------
  function renderDebugPanel() {
    var old = document.getElementById('tsDebugPanel');
    if (old) old.remove();
    var scope = isMobileViewport() ? 'mobile' : 'desktop';

    var wholeFieldRows = [];
    var seenKeys = {};
    document.querySelectorAll('[data-ts]').forEach(function (el) {
      var key = el.dataset.ts;
      if (seenKeys[key]) return;
      seenKeys[key] = true;
      var id = CURRENT_SETTINGS[key + '_style_' + scope];
      var style = id ? STYLES_BY_ID[scope][id] : null;
      var status;
      if (!id) status = 'Default (no style chosen)';
      else if (!style) status = '\u26A0\uFE0F BROKEN \u2014 style id ' + id + ' is stored but does not exist in loaded styles';
      else status = 'style #' + id + ' (' + [style.font_family, Number(style.font_size) > 0 ? style.font_size + 'px' : null, style.color, style.text_align].filter(Boolean).join(', ') + ')';
      wholeFieldRows.push('<tr><td style="padding:3px 8px;font-family:monospace">' + key + '</td><td style="padding:3px 8px">' + status + '</td></tr>');
    });

    var selRows = [];
    var seenClasses = {};
    var injectedCSS = (document.getElementById('tsInlineStylesCSS') || {}).textContent || '';
    document.querySelectorAll('[class*="tsd-"], [class*="tsm-"]').forEach(function (el) {
      el.className.split(/\s+/).forEach(function (cls) {
        var m = cls.match(/^ts([dm])-(\d+)$/);
        if (!m || seenClasses[cls]) return;
        seenClasses[cls] = true;
        var elScope = m[1] === 'd' ? 'desktop' : 'mobile';
        var relevant = elScope === scope;
        var style = STYLES_BY_ID[elScope] ? STYLES_BY_ID[elScope][m[2]] : null;
        var cssExists = injectedCSS.indexOf('.' + cls + '{') !== -1;
        var status;
        if (!style) status = '\u26A0\uFE0F BROKEN \u2014 style id ' + m[2] + ' not found in loaded ' + elScope + ' styles at all';
        else if (!cssExists) status = '\u26A0\uFE0F BROKEN \u2014 style exists but has no properties set';
        else status = 'OK \u2014 style #' + m[2] + ' (' + [style.font_family, Number(style.font_size) > 0 ? style.font_size + 'px' : null, style.color].filter(Boolean).join(', ') + ')';
        selRows.push('<tr' + (relevant ? '' : ' style="opacity:.4"') + '><td style="padding:3px 8px;font-family:monospace">.' + cls + '</td><td style="padding:3px 8px">' + elScope + (relevant ? ' (current viewport)' : ' (other viewport)') + '</td><td style="padding:3px 8px">' + status + '</td></tr>');
      });
    });

    var panel = document.createElement('div');
    panel.id = 'tsDebugPanel';
    panel.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:60vh;overflow:auto;background:#0b0b0b;color:#ddd;font-size:12px;z-index:999999;padding:12px;border-top:2px solid #0af';
    panel.innerHTML =
      '<div style="color:#0af;font-weight:700;margin-bottom:6px">TYPOGRAPHY DEBUG \u2014 viewport currently detected as: ' + scope.toUpperCase() + ' \u2014 <a href="#" style="color:#0af" onclick="document.getElementById(\'tsDebugPanel\').remove();return false;">close</a></div>' +
      '<div style="color:#0af;margin:8px 0 4px">Whole-field styles (' + wholeFieldRows.length + ' keys)</div>' +
      '<table style="width:100%;border-collapse:collapse">' + wholeFieldRows.join('') + '</table>' +
      '<div style="color:#0af;margin:12px 0 4px">Highlighted-text styles found on this page (' + selRows.length + ')</div>' +
      '<table style="width:100%;border-collapse:collapse">' + selRows.join('') + '</table>';
    document.body.appendChild(panel);
  }

  if (global.location.search.indexOf('ts_debug=1') !== -1) {
    global.addEventListener('load', function () { setTimeout(renderDebugPanel, 800); });
  }

  // -------------------------------------------------------------------
  // 6. PUBLIC API
  // -------------------------------------------------------------------
  global.TypographyEngine = {
    loadStyles: loadStyles,
    setCurrentSettings: setCurrentSettings,
    getStyle: function (scope, id) { return id ? STYLES_BY_ID[scope][id] : null; },
    setPreviewScope: setPreviewScope,
    applyAllTagged: applyAllTagged,
    applyTagged: applyTagged,
    isMobileViewport: isMobileViewport,
    richTextField: richTextField,
    initEditors: initEditors,
    resetEditors: resetEditors,
    applyPen: applyPen,
    valueOf: valueOf,
    debug: renderDebugPanel
  };
})(window);
