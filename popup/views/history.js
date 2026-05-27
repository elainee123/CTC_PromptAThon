/**
 * Renders the purchase history list for the current month.
 *
 * @param {HTMLElement} container    - The element to render history items into.
 * @param {Array}       transactions - Array of transaction objects for the current month.
 */
export function renderHistory(container, transactions) {
  if (!transactions.length) {
    container.innerHTML = `
      <div class="empty">
        <span>✨</span>
        <p>No purchases this month — keep it up!</p>
      </div>`;
    return;
  }

  container.innerHTML = [...transactions]
    .reverse()
    .map(t => {
      const date    = new Date(t.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
      const blocked = t.wasBlocked !== false;
      return `
        <div class="history-item">
          <div class="history-icon">${blocked ? '🛡️' : '🛒'}</div>
          <div class="history-info">
            <div class="history-site">${t.site || 'Unknown'}</div>
            <div class="history-date">${date}</div>
          </div>
          <div class="${blocked ? 'history-amount val-green' : 'history-amount'}">
            ${blocked ? 'Saved $' : '-$'}${(t.amount || 0).toFixed(2)}
          </div>
        </div>`;
    })
    .join('');
}
