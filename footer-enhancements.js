(function () {
  'use strict';

  var whatsappIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.92 11.92 0 0 0 12.04 0C5.45 0 .1 5.35.1 11.94c0 2.1.55 4.14 1.6 5.94L0 24l6.29-1.65a11.9 11.9 0 0 0 5.74 1.46h.01c6.59 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.18-3.46-8.39ZM12.04 21.8h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.73.98 1-3.63-.24-.38a9.9 9.9 0 0 1-1.52-5.24c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-1.77-.88-2.93-1.57-4.1-3.56-.31-.53.31-.49.88-1.63.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.62.71.23 1.35.2 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg>';
  var upIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  var socialIcons = {
    Pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 0C5.39 0 2.01 4.77 2.01 8.75c0 2.41.91 4.55 2.86 5.35.32.13.61 0 .7-.35.07-.24.22-.86.29-1.12.09-.35.06-.47-.2-.78-.56-.66-.92-1.51-.92-2.72 0-3.54 2.65-6.71 6.9-6.71 3.76 0 5.83 2.3 5.83 5.37 0 4.04-1.79 7.45-4.44 7.45-1.47 0-2.57-1.21-2.22-2.7.42-1.78 1.23-3.7 1.23-4.99 0-1.15-.62-2.11-1.9-2.11-1.51 0-2.72 1.56-2.72 3.65 0 1.33.45 2.23.45 2.23s-1.54 6.53-1.81 7.67c-.54 2.28-.08 5.08-.04 5.36.02.17.24.21.34.08.14-.18 1.95-2.42 2.57-4.66.17-.63.98-3.82.98-3.82.49.93 1.91 1.75 3.42 1.75 4.5 0 7.55-4.1 7.55-9.59C20.88 3.95 17.36 0 12.04 0Z"/></svg>',
    YouTube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.19a3 3 0 0 0-2.11-2.12C19.52 3.56 12 3.56 12 3.56s-7.52 0-9.39.51A3 3 0 0 0 .5 6.19 31.1 31.1 0 0 0 0 12a31.1 31.1 0 0 0 .5 5.81 3 3 0 0 0 2.11 2.12c1.87.51 9.39.51 9.39.51s7.52 0 9.39-.51a3 3 0 0 0 2.11-2.12A31.1 31.1 0 0 0 24 12a31.1 31.1 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/></svg>',
    Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22.68 0H1.32C.59 0 0 .59 0 1.32v21.36C0 23.41.59 24 1.32 24h11.5v-9.29H9.69v-3.62h3.13V8.41c0-3.1 1.89-4.79 4.66-4.79 1.33 0 2.47.1 2.8.14v3.25h-1.92c-1.51 0-1.8.72-1.8 1.77v2.31h3.59l-.47 3.62h-3.12V24h6.12c.73 0 1.32-.59 1.32-1.32V1.32C24 .59 23.41 0 22.68 0Z"/></svg>'
  };
  var siteFavicon = 'https://static.wixstatic.com/media/2efa41_f5b76adb62a34d9bb01837838dd6064c~mv2.png/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/2efa41_f5b76adb62a34d9bb01837838dd6064c~mv2.png';
  var mobileMenuGroups = [
    {
      heading: 'Explore',
      links: [
        { label: 'Home', href: 'index.html' },
        { label: 'About Us', href: 'about-us.html' },
        { label: 'Instagram', href: 'https://www.instagram.com/eureka.trips', external: true },
        { label: 'What we do', href: 'whats-included.html' },
        { label: 'Testimonials', href: 'index.html#reviews' },
        { label: 'Capture on Eureka', href: 'about-us.html#gallery' }
      ]
    },
    {
      heading: 'For You',
      links: [
        { label: 'Explore All Trips', href: 'destinations.html' },
        { label: 'Build Your Own Adventure', href: 'custom-trips.html' },
        { label: 'Destination Guides', href: 'destination-guide.html' },
        { label: 'Event & Corporate', href: 'contact-us.html' }
      ]
    },
    {
      heading: 'International Tours',
      links: [
        { label: 'Indonesia', href: 'destinations.html?q=Indonesia' },
        { label: 'Philippines', href: 'destinations.html?q=Philippines' },
        { label: 'Egypt', href: 'destinations.html?q=Egypt' },
        { label: 'Spain', href: 'destinations.html?q=Spain' },
        { label: 'Maldives', href: 'destinations.html?q=Maldives' },
        { label: 'Sri Lanka', href: 'destinations.html?q=Sri%20Lanka' }
      ]
    },
    {
      heading: 'More',
      links: [
        { label: 'Linktree', href: 'https://linktr.ee/eurekatrips', external: true },
        { label: 'Get Inspired', href: 'blog.html' },
        { label: 'Contact Us', href: 'contact-us.html' },
        { label: 'Creators Hub', href: 'contact-us.html' },
        { label: 'Payment Policy', href: 'terms-conditions.html' },
        { label: 'Terms & Conditions', href: 'terms-conditions.html' },
        { label: 'Privacy Policy', href: 'privacy-policy.html' }
      ]
    }
  ];

  function installFavicon() {
    var favicon = document.querySelector('link[rel~="icon"]') || document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = siteFavicon;
    if (!favicon.parentNode) document.head.appendChild(favicon);
  }

  function installFooterEnhancements() {
    var footer = document.querySelector('.footer');
    if (!document.querySelector('.site-whatsapp-float')) {
      var whatsapp = document.createElement('a');
      whatsapp.className = 'site-whatsapp-float';
      whatsapp.href = 'https://wa.me/919792496457';
      whatsapp.target = '_blank';
      whatsapp.rel = 'noopener';
      whatsapp.setAttribute('aria-label', 'Chat with Eureka Trips on WhatsApp');
      whatsapp.title = 'WhatsApp';
      whatsapp.innerHTML = whatsappIcon;
      document.body.appendChild(whatsapp);
    }
    installMobileDrawerMenu();

    if (!footer || footer.dataset.footerEnhanced === 'true') return;
    footer.dataset.footerEnhanced = 'true';
    ensureFooterSocialLinks(footer);

    footer.querySelectorAll('.ft-col-h-toggle').forEach(function (heading) {
      heading.classList.add('open');
      var links = heading.nextElementSibling;
      if (links && links.classList.contains('ft-col-links')) links.classList.add('open');
    });

    var toTop = document.querySelector('.site-scroll-top');
    if (!toTop) {
      toTop = document.createElement('button');
      toTop.type = 'button';
      toTop.className = 'site-scroll-top';
      toTop.setAttribute('aria-label', 'Back to top');
      toTop.title = 'Back to top';
      toTop.innerHTML = upIcon;
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(toTop);
    }

    var topArrowTimer = null;
    var topArrowScrollTimer = null;
    function canShowTopArrow() {
      return window.innerWidth <= 768 && window.scrollY > window.innerHeight * 2.4;
    }
    function hideTopArrow() {
      toTop.classList.remove('is-visible');
      window.clearTimeout(topArrowTimer);
    }
    function showTopArrowAfterScroll() {
      if (!canShowTopArrow()) {
        hideTopArrow();
        return;
      }
      toTop.classList.add('is-visible');
      window.clearTimeout(topArrowTimer);
      topArrowTimer = window.setTimeout(hideTopArrow, 4500);
    }
    function handleTopArrowScroll() {
      hideTopArrow();
      window.clearTimeout(topArrowScrollTimer);
      if (canShowTopArrow()) {
        topArrowScrollTimer = window.setTimeout(showTopArrowAfterScroll, 350);
      }
    }
    window.addEventListener('scroll', handleTopArrowScroll, { passive: true });
    window.addEventListener('resize', handleTopArrowScroll);
    handleTopArrowScroll();
  }

  function ensureFooterSocialLinks(footer) {
    var wrap = footer.querySelector('.ft-social');
    if (!wrap) return;
    [
      { label: 'Pinterest', href: 'https://www.pinterest.com/eurekatrips/', icon: socialIcons.Pinterest },
      { label: 'YouTube', href: 'https://www.youtube.com/@eurekatrips', icon: socialIcons.YouTube },
      { label: 'Facebook', href: 'https://www.facebook.com/eurekatrips', icon: socialIcons.Facebook }
    ].forEach(function (item) {
      if (wrap.querySelector('[aria-label="' + item.label + '"]')) return;
      var link = document.createElement('a');
      link.href = item.href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'fsb';
      link.setAttribute('aria-label', item.label);
      link.innerHTML = item.icon;
      wrap.appendChild(link);
    });
  }

  function installMobileDrawerMenu() {
    var drawer = document.querySelector('.mob-drawer');
    var linksWrap = drawer && drawer.querySelector('.mob-links');
    if (!drawer || !linksWrap || drawer.dataset.menuUpdated === 'true') return;
    drawer.dataset.menuUpdated = 'true';
    drawer.classList.add('mob-menu-updated');

    linksWrap.innerHTML = mobileMenuGroups.map(function (group, index) {
      var items = group.links.map(function (link) {
        var target = link.external ? ' target="_blank" rel="noopener"' : '';
        return '<a href="' + link.href + '"' + target + ' onclick="closeDrawer()">' + link.label + '</a>';
      }).join('');
      return '<div class="mob-links-more' + (index === 0 ? ' mob-links-first' : '') + '">' + group.heading + '</div>' + items;
    }).join('');

    var foot = drawer.querySelector('.mob-foot');
    if (!foot) {
      foot = document.createElement('div');
      foot.className = 'mob-foot';
      drawer.appendChild(foot);
    }
    foot.innerHTML = '<button class="mob-cta-btn" type="button" onclick="if(window.openWA){openWA(\'Hi Eureka Trips! I want to chat with you.\')}else{window.open(\'https://wa.me/919792496457\',\'_blank\')}closeDrawer()">Chat with Us</button>';
  }

  var style = document.createElement('style');
  style.textContent = [
    '.footer .footer-grid{max-width:1280px!important;width:100%;grid-template-columns:1.6fr 1fr 1fr 1fr!important;gap:2.5rem!important;margin:0 auto 2.5rem!important;padding-bottom:0!important;border-bottom:0!important}',
    '.footer .footer-grid>div:first-child{justify-self:start;width:min(100%,380px)}',
    '.footer .ft-mission{max-width:380px;line-height:1.42;margin:1rem 0 1.25rem}',
    '.footer .ft-mission strong,.footer .ft-mission b{display:block;margin-bottom:.55rem;font-size:20px;line-height:1.15;letter-spacing:0}',
    '.footer .ft-social{gap:12px;align-items:center;flex-wrap:wrap}',
    '.footer .fsb{width:38px;height:38px;flex:0 0 38px}',
    '.footer .fsb svg{width:17px;height:17px}',
    '.footer .ft-col-h{font-family:"Proxima Nova","Poppins",sans-serif!important;font-size:18px!important;font-weight:600!important;letter-spacing:.3px!important;text-transform:none!important;color:#fff!important;margin-bottom:1.25rem!important;line-height:1.2!important}',
    '.footer .ft-col-links{gap:.7rem!important}',
    '.footer .ft-col-links a{font-family:"Proxima Nova","Poppins",sans-serif!important;font-size:15px!important;color:rgba(255,255,255,.95)!important;font-weight:400!important;line-height:1.35!important}',
    '.footer .ft-contact-item{gap:.625rem!important;margin-bottom:1.125rem!important}',
    '.footer .ft-contact-icon{width:28px!important;height:28px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.4)!important;background:transparent!important;margin-top:1px!important}',
    '.footer .ft-contact-icon svg{width:13px!important;height:13px!important;stroke:#fff!important;fill:none!important;stroke-width:2!important}',
    '.footer .ft-contact-lbl{font-size:14.5px!important;font-weight:700!important;color:#fff!important;margin-bottom:2px!important}',
    '.footer .ft-contact-val{font-size:15.5px!important;color:rgba(255,255,255,.82)!important;font-weight:400!important}',
    '.footer .ft-bottom-row{display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:1.5rem 2.5rem!important;max-width:1280px!important;margin:0 auto 1.75rem!important;padding-top:1.5rem!important;border-top:1px solid rgba(255,255,255,.12)!important}',
    '.footer .ft-pay-row{align-items:center}',
    '.footer .ft-pay-row #ftPayLogos{align-items:center!important;gap:1.5rem!important}',
    '.footer .ft-pay-row #ftPayLogos img,.footer .ft-pay{height:24px!important;max-height:24px!important;width:auto!important;max-width:150px!important;object-fit:contain!important;flex:0 0 auto!important}',
    '.footer .ft-pay-row,.footer .ft-badges{max-width:none!important;margin:0!important}',
    '.footer .ft-badges{gap:2.5rem;align-items:center}',
    '.footer .ft-badge{height:44px;max-width:165px;width:auto;object-fit:contain}',
    '.footer .footer-btm{max-width:1280px!important;margin:1.75rem auto 0!important;padding-top:1.5rem!important;border-top:1px solid rgba(255,255,255,.12)!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:1rem!important;flex-wrap:wrap!important}',
    '.footer .ft-copy{font-size:12.5px!important;color:rgba(255,255,255,.7)!important;font-weight:400!important}',
    '.footer .ft-legal{display:flex!important;gap:1.5rem!important}',
    '.footer .ft-legal a{font-size:12.5px!important;color:rgba(255,255,255,.7)!important}',
    '.site-whatsapp-float{position:fixed;right:14px;bottom:20px;z-index:1200;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#25d366;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.22);transition:transform .2s,background .2s}',
    '.site-whatsapp-float:hover{background:#1ebe5d;color:#fff;transform:scale(1.06)}',
    '.site-whatsapp-float svg{width:28px;height:28px;fill:currentColor}',
    '.site-scroll-top{display:none;border:1px solid rgba(255,255,255,.38);width:44px;height:44px;border-radius:50%;align-items:center;justify-content:center;background:#075c57;color:#fff;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.2);transition:opacity .2s,transform .2s,background .2s}',
    '.site-scroll-top:hover{background:#0a7770}',
    '.site-scroll-top svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}',
    '@media(max-width:768px){.mob-drawer.mob-menu-updated:not(.open):not(.show){right:-100vw!important;transform:translateX(100%)!important;visibility:hidden!important;pointer-events:none!important}.mob-drawer.mob-menu-updated.open,.mob-drawer.mob-menu-updated.show{right:0!important;transform:translateX(0)!important;visibility:visible!important;pointer-events:auto!important}}',
    '@media(max-width:768px){.mob-drawer.mob-menu-updated{background:#02A9A2!important;color:#fff!important;max-width:360px!important;width:min(360px,88vw)!important}.mob-drawer.mob-menu-updated .mob-drawer-head{border-bottom:1px solid rgba(255,255,255,.16)!important}.mob-drawer.mob-menu-updated .mob-close{color:#fff!important}.mob-drawer.mob-menu-updated .mob-links{padding:1rem 0!important;gap:0!important;overflow-y:auto!important}.mob-drawer.mob-menu-updated .mob-links-more{display:block!important;padding:16px 1.5rem 8px!important;border-top:1px solid rgba(255,255,255,.16)!important;margin:6px 0 0!important;font-family:"Poppins",sans-serif!important;font-size:11px!important;font-weight:800!important;letter-spacing:1.4px!important;line-height:1.2!important;color:rgba(255,255,255,.72)!important;text-transform:uppercase!important}.mob-drawer.mob-menu-updated .mob-links-first{border-top:0!important;margin-top:0!important}.mob-drawer.mob-menu-updated .mob-links a{display:block!important;padding:12px 1.5rem!important;border-top:1px solid rgba(255,255,255,.12)!important;font-family:"Apfel Grotezk","Poppins",sans-serif!important;font-size:15px!important;font-weight:700!important;line-height:1.25!important;color:#fff!important}.mob-drawer.mob-menu-updated .mob-links-more+a{border-top:0!important}.mob-drawer.mob-menu-updated .mob-foot{padding:1rem 1.5rem 1.5rem!important;margin-top:auto!important;background:linear-gradient(180deg,rgba(2,169,162,0),#02A9A2 26%)!important}.mob-drawer.mob-menu-updated .mob-cta-btn{background:#FFA43B!important;color:#fff!important;border-radius:10px!important;padding:14px!important;width:100%!important;font-size:14px!important;font-weight:800!important;box-shadow:0 10px 18px rgba(0,0,0,.12)!important}}',
    '@media(max-width:1100px){.footer .footer-grid{grid-template-columns:1fr 1fr!important;gap:2rem!important}}',
    '@media(max-width:768px){.footer-wrap{width:100vw!important;max-width:100vw!important;margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important}.footer{width:100%!important;max-width:none!important;box-sizing:border-box!important;padding:2.5rem 1.25rem 1.5rem!important}.footer .footer-grid{display:grid!important;grid-template-columns:1fr!important;gap:1.5rem!important;width:100%!important;max-width:none!important;margin:0!important;padding-bottom:0!important;border-bottom:0!important}.footer .footer-grid>div:first-child{justify-self:start!important;width:100%!important;max-width:none!important}.footer .ft-mission{width:100%!important;max-width:none!important}.footer .ft-social{gap:10px!important}.footer .fsb{width:34px!important;height:34px!important;flex-basis:34px!important}.footer .fsb svg{width:15px!important;height:15px!important}.footer .ft-col-h{font-size:16px!important;line-height:20px!important;margin-bottom:.6rem!important}.footer .ft-col-h-toggle{display:flex!important;align-items:center!important;justify-content:space-between!important}.footer .ft-col-links{gap:.35rem!important}.footer .ft-col-links a{font-size:13px!important;line-height:1.28!important}.footer .ft-contact-item{gap:.5rem!important;margin-bottom:.8rem!important}.footer .ft-contact-lbl{font-size:13px!important}.footer .ft-contact-val{font-size:12px!important}.footer .ft-bottom-row{width:100%!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;gap:1rem!important;margin:1.25rem 0 0!important;padding-top:1.25rem!important}.footer .ft-pay-row,.footer .ft-badges{width:100%!important;max-width:100%!important}.footer .ft-pay-row #ftPayLogos{gap:1rem!important;flex-wrap:wrap!important}.footer .ft-pay-row #ftPayLogos img,.footer .ft-pay{height:20px!important;max-height:20px!important;max-width:120px!important}.footer .ft-badges{gap:1.25rem!important;flex-wrap:wrap!important}.footer .ft-badge{height:38px!important;max-width:140px!important}.footer .footer-btm{width:100%!important;margin:1rem 0 0!important;flex-direction:column!important;align-items:flex-start!important;gap:.75rem!important}.footer .ft-legal{gap:1rem!important;flex-wrap:wrap!important}.site-whatsapp-float{right:14px;bottom:calc(72px + env(safe-area-inset-bottom,0px));width:56px;height:56px}.site-whatsapp-float svg{width:32px;height:32px}.site-scroll-top{display:flex;position:fixed;left:16px;right:auto;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:1200;width:42px;height:42px;border-radius:10px;background:rgba(1,58,56,.52);border:1px solid rgba(255,255,255,.34);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 8px 20px rgba(0,0,0,.16);opacity:0;pointer-events:none;transform:translateY(8px)}.site-scroll-top svg{width:18px;height:18px}.site-scroll-top.is-visible{opacity:1;pointer-events:auto;transform:translateY(0)}}'
  ].join('');
  document.head.appendChild(style);

  installFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installFooterEnhancements);
  } else {
    installFooterEnhancements();
  }
}());
