(() => {
  "use strict";

  /**
   * IB_UIManager owns the overlay lifecycle: mounting, unmounting, and the cooldown timer.
   * It delegates HTML construction to IB_Builder and budget display to IB_Budget.
   */

  let overlayEl = null;
  let cooldownTimer = null;

  /** Refreshes dynamic content sections (comparisons, investments, nudge, budget bar). */
  function refreshContent(price, settings, spending) {
    const scroll = document.getElementById("ibb-comp-scroll");
    const rows = document.getElementById("ibb-invest-rows");
    const nudge = document.getElementById("ibb-nudge");

    if (scroll)
      scroll.innerHTML = window.IB_Builder.buildComparisonCards(price);
    if (rows) rows.innerHTML = window.IB_Builder.buildInvestRows(price);
    if (nudge) nudge.innerHTML = window.IB_Builder.buildNudge(price);

    window.IB_Budget.update(price, settings, spending);
  }

  window.IB_UIManager = {
    isShowing() {
      return overlayEl !== null;
    },

    /**
     * Builds and animates the blocker overlay into view.
     *
     * @param {number}   price     - Auto-detected product price (0 if not found).
     * @param {Object}   settings  - Extension settings.
     * @param {Object}   spending  - Current spending record.
     * @param {Function} onProceed - Called with the final price when the user buys anyway.
     * @param {Function} onCancel  - Called when the user cancels.
     */
    showOverlay(price = 0, settings, spending, onProceed, onCancel) {
      if (this.isShowing()) return;

      overlayEl = document.createElement("div");
      overlayEl.id = "impulse-blocker-overlay";
      overlayEl.innerHTML = window.IB_Builder.buildOverlayHTML();
      document.body.appendChild(overlayEl);

      const priceInput = document.getElementById("ibb-price");
      if (priceInput && price > 0) priceInput.value = price.toFixed(2);

      refreshContent(price, settings, spending);

      // Live-update dynamic sections as the user edits the price
      priceInput?.addEventListener("input", () => {
        refreshContent(parseFloat(priceInput.value) || 0, settings, spending);
      });

      this._startCooldown(settings.cooldownSeconds || 30, onProceed);
      this._bindCancelAction(onCancel);

      requestAnimationFrame(() => overlayEl.classList.add("ibb-visible"));
    },

    /** Animates the overlay out and removes it from the DOM. */
    hideOverlay() {
      if (!overlayEl) return;
      overlayEl.classList.remove("ibb-visible");
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      setTimeout(() => {
        overlayEl?.remove();
        overlayEl = null;
      }, 500);
    },

    // ─── Private ──────────────────────────────────────────────────────────────

    _startCooldown(seconds, onProceed) {
      let remaining = seconds;
      const proceedBtn = document.getElementById("ibb-proceed");
      const countdownEl = document.getElementById("ibb-cooldown");

      if (countdownEl)
        countdownEl.textContent = `Unlocks in ${remaining}s — use this time to think`;

      cooldownTimer = setInterval(() => {
        remaining--;
        if (countdownEl)
          countdownEl.textContent =
            remaining > 0 ? `Unlocks in ${remaining}s` : "";
        if (remaining <= 0) {
          clearInterval(cooldownTimer);
          proceedBtn?.classList.remove("ibb-locked");
          if (proceedBtn) proceedBtn.textContent = "I'm sure — buy it";
        }
      }, 1000);

      proceedBtn?.addEventListener("click", () => {
        if (proceedBtn.classList.contains("ibb-locked")) return;
        const finalPrice =
          parseFloat(document.getElementById("ibb-price")?.value) || 0;
        this.hideOverlay();
        onProceed?.(finalPrice);
      });
    },

    _bindCancelAction(onCancel) {
      document.getElementById("ibb-cancel")?.addEventListener("click", () => {
        // Read the price BEFORE hideOverlay() removes the DOM.
        // The user may have corrected the auto-detected price in the input;
        // we want the history to record what they actually saw, not the raw scrape.
        const cancelPrice =
          parseFloat(document.getElementById("ibb-price")?.value) || 0;
        this.hideOverlay();
        onCancel?.(cancelPrice);
      });
    },
  };
})();
