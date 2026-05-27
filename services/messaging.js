/**
 * MessagingService provides promise-based wrappers around chrome.runtime.sendMessage.
 * All communication between the popup and the background service worker goes through here.
 *
 * Design contract: these methods always RESOLVE (never reject).
 * On error they resolve with `null` and log a console warning.
 * This means callers — especially UI code — can use simple null checks
 * (`if (!data) return`) without wrapping every call in try/catch.
 *
 * Chrome requires `lastError` to be read inside the callback or it logs
 * "Unchecked runtime.lastError" to the console. We read it here so callers
 * never need to worry about it.
 */

function sendMsg(payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[IB] Message failed:", chrome.runtime.lastError.message);
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

export const MessagingService = {
  getData() {
    return sendMsg({ type: "GET_DATA" });
  },
  logPurchase(amount, site, wasBlocked) {
    return sendMsg({ type: "LOG_PURCHASE", amount, site, wasBlocked });
  },
  updateSettings(settings) {
    return sendMsg({ type: "UPDATE_SETTINGS", settings });
  },
  resetSpending() {
    return sendMsg({ type: "RESET_SPENDING" });
  },
};
