(() => {
  'use strict';

  /**
   * IB_Builder contains pure HTML-construction functions for the blocker overlay.
   * Nothing here reads or writes DOM state — it only returns HTML strings or elements.
   */

  function pickRandom(arr, n) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  }

  window.IB_Builder = {
    /**
     * Returns a row of scrollable comparison cards for a given price.
     */
    buildComparisonCards(price) {
      if (price <= 0) return '';
      const { COMPARISONS = [] } = window.IB_Config || {};

      return pickRandom(COMPARISONS, 5)
        .map(c => {
          const count = Math.floor(price / c.cost);
          if (count < 1) return '';
          return `
            <div class="ibb-comp-card">
              <span class="ibb-comp-emoji">${c.emoji}</span>
              <div class="ibb-comp-count">${count}</div>
              <div class="ibb-comp-label">${count === 1 ? c.sing : c.plur}</div>
            </div>`;
        })
        .filter(Boolean)
        .join('');
    },

    /**
     * Returns compound-interest projection rows for a given price.
     */
    buildInvestRows(price) {
      if (price <= 0) return '';
      const {
        INVESTMENT_GROWTH_RATE: rate = 0.10,
        INVESTMENT_YEARS: years = [1, 5, 10, 20, 30],
      } = window.IB_Config || {};

      const vals = years.map(y => price * Math.pow(1 + rate, y));
      const maxVal = vals[vals.length - 1];

      return years.map((y, i) => {
        const pct = (vals[i] / maxVal) * 100;
        const display = vals[i] >= 1000
          ? `${(vals[i] / 1000).toFixed(1)}k`
          : vals[i].toFixed(0);
        return `
          <div class="ibb-invest-row">
            <span class="ibb-invest-years">${y} yr${y > 1 ? 's' : ''}</span>
            <div class="ibb-invest-bar-wrap">
              <div class="ibb-invest-bar" style="width:${pct}%"></div>
            </div>
            <span class="ibb-invest-val">$${display}</span>
          </div>`;
      }).join('');
    },

    /**
     * Returns a random psychological nudge message for a given price.
     */
    buildNudge(price) {
      const { NUDGES = [] } = window.IB_Config || {};
      if (!NUDGES.length) return '';
      const pick = NUDGES[Math.floor(Math.random() * NUDGES.length)];
      return pick(price > 0 ? price : 50);
    },

    /**
     * Returns the full overlay card HTML string.
     * IDs used here are referenced by budget.js and manager.js.
     */
    buildOverlayHTML() {
      return `
        <div class="ibb-card">
          <div class="ibb-banner">
            <div class="ibb-banner-content">
              <span class="ibb-hand">✋</span>
              <div class="ibb-title">Wait — do you really need this?</div>
              <div class="ibb-subtitle">Let your wallet weigh in first</div>
            </div>
          </div>

          <div class="ibb-body">
            <div class="ibb-price-section">
              <div class="ibb-price-label">About to spend</div>
              <div class="ibb-price-input-wrap">
                <span class="ibb-price-currency">$</span>
                <input type="number" class="ibb-price-input" id="ibb-price"
                       placeholder="0" step="0.01" min="0">
              </div>
            </div>

            <div class="ibb-budget-section">
              <div class="ibb-budget-header">
                <span class="ibb-budget-label">Monthly budget</span>
                <span class="ibb-budget-pct" id="ibb-pct">0%</span>
              </div>
              <div class="ibb-bar-track">
                <div class="ibb-bar-fill" id="ibb-bar-fill" style="width:0%"></div>
                <div class="ibb-bar-new"  id="ibb-bar-new"  style="left:0%;width:0%"></div>
              </div>
              <div class="ibb-budget-detail">
                <span id="ibb-spent">$0 spent</span>
                <span id="ibb-budget-total">$0 budget</span>
              </div>
            </div>

            <div class="ibb-comparisons">
              <div class="ibb-comp-title">You could get instead...</div>
              <div class="ibb-comp-scroll" id="ibb-comp-scroll"></div>
            </div>

            <div class="ibb-invest-section">
              <div class="ibb-invest-title">Or invest it and watch it grow</div>
              <div id="ibb-invest-rows"></div>
            </div>

            <div class="ibb-nudge" id="ibb-nudge"></div>

            <div class="ibb-actions">
              <button class="ibb-btn ibb-btn-cancel"  id="ibb-cancel">I don't need this</button>
              <button class="ibb-btn ibb-btn-proceed ibb-locked" id="ibb-proceed">Buy anyway</button>
              <div class="ibb-cooldown-text" id="ibb-cooldown"></div>
            </div>
          </div>
        </div>`;
    },
  };
})();
