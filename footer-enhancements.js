(function () {
  'use strict';

  var whatsappIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.52 3.48A11.92 11.92 0 0 0 12.04 0C5.45 0 .1 5.35.1 11.94c0 2.1.55 4.14 1.6 5.94L0 24l6.29-1.65a11.9 11.9 0 0 0 5.74 1.46h.01c6.59 0 11.94-5.35 11.94-11.94 0-3.19-1.24-6.18-3.46-8.39ZM12.04 21.8h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.73.98 1-3.63-.24-.38a9.9 9.9 0 0 1-1.52-5.24c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.93 9.92Zm5.44-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-1.77-.88-2.93-1.57-4.1-3.56-.31-.53.31-.49.88-1.63.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.62.71.23 1.35.2 1.86.12.57-.09 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"/></svg>';
  var upIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  var brandLogo = 'https://static.wixstatic.com/media/2efa41_f5b76adb62a34d9bb01837838dd6064c~mv2.png';
  var brandFavicon = 'https://static.wixstatic.com/media/2efa41_f5b76adb62a34d9bb01837838dd6064c~mv2.png/v1/fill/w_192,h_192,lg_1,usm_0.66_1.00_0.01/2efa41_f5b76adb62a34d9bb01837838dd6064c~mv2.png';

  function installBrandAssets() {
    document.querySelectorAll('.nav-logo-img').forEach(function (logo) {
      logo.src = brandLogo;
      logo.alt = 'Eureka Trips';
    });

    document.querySelectorAll('.mob-drawer-head > span').forEach(function (wordmark) {
      var logo = document.createElement('img');
      logo.className = 'site-drawer-brand';
      logo.src = brandLogo;
      logo.alt = 'Eureka Trips';
      logo.decoding = 'async';
      wordmark.replaceWith(logo);
    });

    var favicon = document.querySelector('link[rel~="icon"]') || document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = brandFavicon;
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

    if (!footer || footer.dataset.footerEnhanced === 'true') return;
    footer.dataset.footerEnhanced = 'true';

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

    if ('IntersectionObserver' in window) {
      var footerObserver = new IntersectionObserver(function (entries) {
        toTop.classList.toggle('is-visible', entries[0].isIntersecting);
      }, { threshold: 0.08 });
      footerObserver.observe(footer);
    } else {
      toTop.classList.add('is-visible');
    }
  }

  var style = document.createElement('style');
  style.textContent = [
    '.site-drawer-brand{width:112px;height:auto;display:block;object-fit:contain}',
    '.footer .footer-grid{max-width:1280px;width:100%;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:2.5rem}',
    '.footer .ft-mission{max-width:280px}',
    '.site-whatsapp-float{position:fixed;right:14px;bottom:20px;z-index:1200;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#25d366;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.22);transition:transform .2s,background .2s}',
    '.site-whatsapp-float:hover{background:#1ebe5d;color:#fff;transform:scale(1.06)}',
    '.site-whatsapp-float svg{width:28px;height:28px;fill:currentColor}',
    '.site-scroll-top{display:none;border:1px solid rgba(255,255,255,.38);width:44px;height:44px;border-radius:50%;align-items:center;justify-content:center;background:#075c57;color:#fff;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.2);transition:opacity .2s,transform .2s,background .2s}',
    '.site-scroll-top:hover{background:#0a7770}',
    '.site-scroll-top svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}',
    '@media(max-width:1100px){.footer .footer-grid{grid-template-columns:1fr 1fr;gap:2rem}}',
    '@media(max-width:768px){.footer-wrap{width:100vw!important;max-width:100vw!important;margin-left:calc(50% - 50vw)!important;margin-right:calc(50% - 50vw)!important}.footer{width:100%;max-width:none;box-sizing:border-box;padding-left:1rem;padding-right:1rem}.footer .footer-grid{grid-template-columns:1fr;gap:2rem;width:100%;max-width:none;margin-left:0;margin-right:0}.footer .footer-grid>div:first-child,.footer .ft-mission{width:100%;max-width:none}.footer .footer-btm{width:100%}.site-whatsapp-float{right:14px;bottom:calc(72px + env(safe-area-inset-bottom,0px));width:56px;height:56px}.site-whatsapp-float svg{width:32px;height:32px}.site-scroll-top{display:flex;position:fixed;right:20px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:1200;opacity:0;pointer-events:none;transform:translateY(8px)}.site-scroll-top.is-visible{opacity:1;pointer-events:auto;transform:translateY(0)}}'
  ].join('');
  document.head.appendChild(style);

  installBrandAssets();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installFooterEnhancements);
  } else {
    installFooterEnhancements();
  }
}());
