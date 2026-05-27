(() => {
  'use strict';

  /**
   * IB_PriceDetector handles scanning the DOM to find prices and identifying
   * buy/checkout buttons.
   */
  window.IB_PriceDetector = {
    /**
     * Tries to find a product price on the active web page using common e-commerce CSS selectors
     * and fallback regex searches in the page's body text.
     * @returns {number} Detected price, or 0 if not found.
     */
    detectPrice() {
      const priceSelectors = [
        '#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen',
        '[data-price]', '.product-price', '.price', '.current-price',
        '.sale-price', '.final-price', '[itemprop="price"]',
        '.price-current', '.price__current', '.pdp-price',
        '.product__price', '.ProductPrice', '.price-item--sale'
      ];
      
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent || el.getAttribute('data-price') || el.getAttribute('content') || '';
          const match = text.match(/[\d,]+\.?\d{0,2}/);
          if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
          }
        }
      }

      // Fallback: search body text for dollar values
      const body = document.body.innerText;
      const priceMatches = body.match(/\$[\d,]+\.?\d{0,2}/g);
      if (priceMatches && priceMatches.length > 0) {
        const prices = priceMatches
          .map(p => parseFloat(p.replace(/[$,]/g, '')))
          .filter(p => p > 0 && p < 100000);
        if (prices.length > 0) {
          return prices[0];
        }
      }
      return 0;
    },

    /**
     * Inspects an element's text content, id, classes, and data actions to determine
     * if it matches any pattern of a buy or checkout button.
     * @param {HTMLElement} el - The DOM element to inspect.
     * @returns {boolean} True if it matches buy patterns defined in config.
     */
    isBuyButton(el) {
      if (!el) return false;
      const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim();
      const id = (el.id || '').toLowerCase();
      const classes = (el.className || '').toString().toLowerCase();
      const dataAction = (el.getAttribute('data-action') || '').toLowerCase();
      const combined = `${text} ${id} ${classes} ${dataAction}`;
      
      const config = window.IB_Config || {};
      const patterns = config.BUY_PATTERNS || [];
      return patterns.some(p => p.test(combined));
    }
  };
})();
