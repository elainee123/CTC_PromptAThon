(() => {
  "use strict";

  /**
   * Entry point for the Impulse Buy Blocker content script.
   * Listens for buy-button clicks in the capture phase, intercepts them,
   * and delegates to IB_UIManager to show the blocker overlay.
   *
   * Note: content scripts cannot use ES modules, so chrome.runtime.sendMessage
   * is called directly here. lastError is always checked — Chrome logs
   * "Unchecked runtime.lastError" if a callback is provided but lastError is not read.
   */

  let isBypassing = false;

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Thin wrapper around chrome.runtime.sendMessage that reads lastError so Chrome
   * doesn't log "Unchecked runtime.lastError", then calls the optional callback.
   *
   * @param {Object}    payload  - Message to send to the background.
   * @param {Function} [onReply] - Called with the response (or null on error).
   */
  function send(payload, onReply) {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[IB] sendMessage failed:",
          chrome.runtime.lastError.message,
        );
        onReply?.(null);
        return;
      }
      onReply?.(response);
    });
  }

  // ─── Click interceptor ────────────────────────────────────────────────────────

  function interceptClicks(e) {
    if (isBypassing) return;

    const {
      IB_Config: config,
      IB_PriceDetector: detector,
      IB_UIManager: ui,
    } = window;
    if (!config || !detector || !ui) return;

    let target = e.target;
    let depth = 0;

    while (target && depth < 5) {
      if (
        target.matches?.(config.BUTTON_SELECTORS) &&
        detector.isBuyButton(target)
      ) {
        send({ type: "GET_DATA" }, (response) => {
          if (!response || response.settings?.enabled === false) return;
          if (ui.isShowing()) return;

          const price = detector.detectPrice();

          ui.showOverlay(
            price,
            response.settings,
            response.spending,
            // onProceed: user waited out the cooldown and confirmed the purchase
            (finalPrice) => {
              send(
                {
                  type: "LOG_PURCHASE",
                  amount: finalPrice,
                  site: window.location.hostname,
                  wasBlocked: false,
                },
                () => {
                  // Bypass the interceptor for this one programmatic click
                  isBypassing = true;
                  target.click();
                  isBypassing = false;
                },
              );
            },
            // onCancel: user dismissed the overlay without buying
            () => {
              // Fire-and-forget — no callback needed, so no lastError check required
              chrome.runtime.sendMessage({
                type: "LOG_PURCHASE",
                amount: price,
                site: window.location.hostname,
                wasBlocked: true,
              });
            },
          );
        });

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      target = target.parentElement;
      depth++;
    }
  }

  document.addEventListener("click", interceptClicks, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && window.IB_UIManager?.isShowing()) {
      window.IB_UIManager.hideOverlay();
    }
  });
})();
