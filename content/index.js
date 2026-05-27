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

  // ─── Helpers ────────────────────────────────────────────────────────────────

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

  // ─── Click interceptor ──────────────────────────────────────────────────────

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
        // Capture target now — it may be inaccessible inside the async callback
        // once the DOM has changed (e.g. SPA navigation).
        const clickedTarget = target;

        // Swallow the click immediately so the site's own handler doesn't fire.
        // If we later discover the extension is disabled, we re-fire it below
        // using the isBypassing flag so it passes through our interceptor cleanly.
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        send({ type: "GET_DATA" }, (response) => {
          // Extension disabled or storage unavailable — restore the click.
          if (!response || response.settings?.enabled === false) {
            isBypassing = true;
            clickedTarget.click();
            isBypassing = false;
            return;
          }

          // Another overlay already open (e.g. user double-clicked).
          if (ui.isShowing()) return;

          const price = detector.detectPrice();

          ui.showOverlay(
            price,
            response.settings,
            response.spending,

            // onProceed: user waited out the cooldown and chose to buy.
            // `finalPrice` is whatever the user has in the price input —
            // the overlay lets them correct the auto-detected amount.
            (finalPrice) => {
              send(
                {
                  type: "LOG_PURCHASE",
                  amount: finalPrice,
                  site: window.location.hostname,
                  wasBlocked: false,
                },
                () => {
                  // Bypass our interceptor for this one programmatic re-click.
                  isBypassing = true;
                  clickedTarget.click();
                  isBypassing = false;
                },
              );
            },

            // onCancel: user dismissed the overlay — record as blocked.
            // `cancelPrice` is read from the input before the overlay is torn
            // down, so it reflects any price correction the user made.
            (cancelPrice) => {
              // Fire-and-forget: no callback means Chrome won't set lastError.
              chrome.runtime.sendMessage({
                type: "LOG_PURCHASE",
                amount: cancelPrice,
                site: window.location.hostname,
                wasBlocked: true,
              });
            },
          );
        });

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
