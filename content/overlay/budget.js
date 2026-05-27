(() => {
  'use strict';

  /**
   * IB_Budget handles budget-bar calculations and updates the relevant DOM elements.
   * It has no knowledge of the overlay lifecycle — it only mutates budget display nodes.
   */
  window.IB_Budget = {
    /**
     * Recalculates the budget progress bar state and updates the DOM.
     * @param {number}  price    - The price the user is about to spend.
     * @param {Object}  settings - Extension settings (monthlyBudget).
     * @param {Object}  spending - Spending record (totalThisMonth).
     */
    update(price, settings, spending) {
      const budget = settings.monthlyBudget || 2000;
      const spent  = spending.totalThisMonth || 0;

      const currentPct = Math.min((spent / budget) * 100, 100);
      const newPct     = Math.min((price  / budget) * 100, 100 - currentPct);
      const totalPct   = Math.min(currentPct + newPct, 100);
      const tier       = totalPct > 80 ? 'ibb-danger' : totalPct > 50 ? 'ibb-warn' : 'ibb-safe';

      const pctEl    = document.getElementById('ibb-pct');
      const fillEl   = document.getElementById('ibb-bar-fill');
      const newEl    = document.getElementById('ibb-bar-new');
      const spentEl  = document.getElementById('ibb-spent');
      const budgetEl = document.getElementById('ibb-budget-total');

      if (pctEl)    { pctEl.textContent = `${Math.round(totalPct)}%`; pctEl.className = `ibb-budget-pct ${tier}`; }
      if (fillEl)   { fillEl.style.width = `${currentPct}%`;          fillEl.className = `ibb-bar-fill ${tier}`;  }
      if (newEl)    { newEl.style.left = `${currentPct}%`;            newEl.style.width = `${newPct}%`;           }
      if (spentEl)  spentEl.textContent  = `$${spent.toFixed(0)} spent`;
      if (budgetEl) budgetEl.textContent = `$${budget.toFixed(0)} budget`;
    },
  };
})();
