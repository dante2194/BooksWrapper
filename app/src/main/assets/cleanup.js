// ==UserScript==
// @name         Amazon: Rufus -> Saved Books + cleanup
// @namespace    local.amazon.cleanup
// @version      1.6
// @description  Replaces the Rufus/Alexa icon with a Saved Books shortcut (new tab), kills the Alexa panel, and hides assorted nav/footer/buybox/country elements.
// @match        https://www.amazon.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const SAVED_BOOKS_URL =
    'https://www.amazon.com/your-books?tabView=saved_books&filtersMapping=' +
    encodeURIComponent('{"contentFilter":[]}');

  // ---- 1. Hide elements via CSS (survives Amazon re-rendering) ----
  const hideSelectors = [
    // your original list
    '#nav-ftr-links',
    '.nav-ftr-batmobile',
    '.topHVE',
    '#nav-button-cart',
    '.hmenu-item',
    '.hmenu-separator',
    '#hmenu-home-container',
    '.hmenu-compress-section',
    '.nav-icon-a11y',
    '#nav-logobar',
    '#ape_detail_mobile-detail-ilm_mweb_wrapper',
    '#Northstar-Buybox-MobileWeb_feature_div',
    '#consumerDigitalBulkBuyBox_feature_div',
    '.a-fixed-right-grid',
    '#mobile-dp-ilm_feature_div_0',
    '#refreshable_mobile_atf_bottom_7_feature_div',
    '#sims-productBundle_feature_div_0',
    // Rufus / Alexa: the button that toggles the panel, plus the panels themselves
    '#nav-rufus-disco',
    '#nav-rufus-avatar',
    '#nav-flyout-rufus',
    '#rufus-container-overlay',
    '.rufus-panel-container',
    '#rufus-ask-rufus-tooltip',
    // country / language / currency footer block
    '.icp-container-mobile',
    '#icp-touch-link-country',
    '#icp-touch-link-language',
    '#icp-touch-link-cop',
    '#nav-flyout-icp-footer-flyout',
    '.icp-up-down-arrow',
  ];

  const style = document.createElement('style');
  style.textContent = hideSelectors.join(',\n') + ' { display: none !important; }' + `
    #nav-saved-books {
      display: inline-flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; cursor: pointer; color: #fff;
      -webkit-tap-highlight-color: transparent;
    }
    #nav-saved-books svg { width: 24px; height: 24px; fill: currentColor; }
  `;
  (document.head || document.documentElement).appendChild(style);

  // ---- 2. Add the Saved Books link next to the (hidden) Rufus button ----
  function buildLink() {
    const a = document.createElement('a');
    a.id = 'nav-saved-books';
    a.href = SAVED_BOOKS_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Saved books');
    a.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4.5L5 22V3a1 1 0 0 1 1-1z"/>' +
      '</svg>';
    return a;
  }

  function ensureLink() {
    if (document.getElementById('nav-saved-books')) return;
    const container = document.querySelector('.nav-rufus-button-container');
    if (container) container.appendChild(buildLink());
  }

  // Remove the Rufus avatar div outright if it appears anywhere
  function removeAvatar() {
    const av = document.getElementById('nav-rufus-avatar');
    if (av) av.remove();
  }

  function tick() {
    removeAvatar();
    ensureLink();
  }

  tick();
  new MutationObserver(tick).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // ---- 3. Stop Amazon's delegated handlers from seeing taps on our icon ----
  // Capture phase on window runs first; we stop propagation but NOT the
  // default action, so the link still opens in a new tab.
  ['click', 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'mousedown', 'mouseup']
    .forEach((type) => {
      window.addEventListener(
        type,
        (e) => {
          if (e.target && e.target.closest && e.target.closest('#nav-saved-books')) {
            e.stopImmediatePropagation();
          }
        },
        true
      );
    });
})();
