/**
 * MessagingService provides promise-based wrappers around chrome.runtime.sendMessage.
 * All communication between the popup/content scripts and the background service worker
 * goes through here, keeping raw chrome API calls in one place.
 */

/**
 * Sends a message to the background service worker and returns a promise.
 * Rejects if chrome.runtime.lastError is set (e.g. service worker not ready,
 * extension context invalidated, or the port closed before a response arrived).
 *
 * Chrome requires lastError to be read inside the callback — if it is not,
 * the browser logs "Unchecked runtime.lastError" to the console.
 *
 * @param {Object} payload - The message object to send.
 * @returns {Promise<any>}
 */
function sendMsg(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
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
