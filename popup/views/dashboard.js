/**
 * Renders the Overview tab: budget ring, spent/remaining stats, and mini-cards.
 *
 * @param {Object} elements - Cached DOM element references from PopupController.
 * @param {Object} settings - Extension settings (monthlyBudget, etc.).
 * @param {Object} spending - Spending record (totalThisMonth, transactions).
 */
export function renderDashboard(elements, settings, spending) {
  const budget    = settings.monthlyBudget || 2000;
  const spent     = spending.totalThisMonth || 0;
  const remaining = Math.max(0, budget - spent);
  const pct       = Math.min((spent / budget) * 100, 100);

  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTx    = (spending.transactions || []).filter(t => new Date(t.date) >= monthStart);
  const blocked    = monthTx.filter(t => t.wasBlocked !== false).length;
  const bobas      = Math.floor(remaining / 7.50);

  elements.statSpent.textContent   = `$${spent.toFixed(0)}`;
  elements.statLeft.textContent    = `$${remaining.toFixed(0)}`;
  elements.statBlocked.textContent = blocked;
  elements.statBobas.textContent   = bobas;

  renderProgressRing(elements, pct);
}

// ─── Private ────────────────────────────────────────────────────────────────

function renderProgressRing(elements, pct) {
  const circumference = 314.16;
  const offset = circumference - (pct / 100) * circumference;
  const color  = pct > 80 ? '#F87171' : pct > 50 ? '#FBBF24' : '#34D399';

  elements.ringFill.style.stroke = color;
  // Small delay triggers the CSS transition on initial load
  setTimeout(() => { elements.ringFill.style.strokeDashoffset = offset; }, 50);
  elements.ringPct.textContent  = `${Math.round(pct)}%`;
  elements.ringPct.style.color  = color;
}
