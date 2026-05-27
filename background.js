import { StorageService } from "./services/storage.js";

// Seed defaults on install. Catch so a storage failure doesn't silently disappear.
chrome.runtime.onInstalled.addListener(() => {
  StorageService.initialize().catch((err) =>
    console.error("[IB] Initialization failed:", err),
  );
});

/**
 * Single message entry point.
 *
 * Key correctness rules for MV3 async message handlers:
 *  1. `return true` must be reached synchronously and unconditionally so Chrome
 *     keeps the response channel open while the promise resolves.
 *  2. Every code path must eventually call sendResponse — including error paths —
 *     otherwise the channel leaks until timeout.
 *  3. Centralising dispatch in one async function means a forgotten `return true`
 *     in a per-case branch can never sneak through.
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  dispatch(msg)
    .then(sendResponse)
    .catch((err) => {
      console.error("[IB] Message handler error:", err);
      sendResponse(null);
    });

  return true; // keep the channel open for the async response
});

// ─── Dispatcher ────────────────────────────────────────────────────────────────

async function dispatch(msg) {
  switch (msg.type) {
    case "GET_DATA":
      return StorageService.getData();

    case "LOG_PURCHASE":
      return StorageService.logPurchase(msg.amount, msg.site, msg.wasBlocked);

    case "UPDATE_SETTINGS":
      return StorageService.updateSettings(msg.settings);

    case "RESET_SPENDING":
      return StorageService.resetSpending();

    default:
      throw new Error(`[IB] Unknown message type: "${msg.type}"`);
  }
}
