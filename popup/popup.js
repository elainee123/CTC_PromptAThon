import { MessagingService }              from '../services/messaging.js';
import { renderDashboard }              from './views/dashboard.js';
import { renderHistory }                from './views/history.js';
import { renderSettings, getSettingsValues } from './views/settings.js';

/**
 * PopupController is the thin shell that wires up the popup's tab navigation,
 * global controls (enable toggle, toast), and delegates all rendering to the
 * per-tab view modules.
 */
class PopupController {
  constructor() {
    this.el = {
      tabs:          document.querySelectorAll('.tab'),
      panels:        document.querySelectorAll('.panel'),
      toggleEnabled: document.getElementById('toggle-enabled'),
      ringFill:      document.getElementById('ring-fill'),
      ringPct:       document.getElementById('ring-pct'),
      statSpent:     document.getElementById('stat-spent'),
      statLeft:      document.getElementById('stat-left'),
      statBlocked:   document.getElementById('stat-blocked'),
      statBobas:     document.getElementById('stat-bobas'),
      historyList:   document.getElementById('history-list'),
      setBudget:     document.getElementById('set-budget'),
      setCooldown:   document.getElementById('set-cooldown'),
      saveBtn:       document.getElementById('save-btn'),
      resetBtn:      document.getElementById('reset-btn'),
      toast:         document.getElementById('toast'),
    };

    this._bindEvents();
    this._load();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.el.tabs.forEach(tab => tab.addEventListener('click', () => this._switchTab(tab)));
    this.el.toggleEnabled.addEventListener('change', e => this._toggleProtection(e.target.checked));
    this.el.saveBtn.addEventListener('click',  () => this._saveSettings());
    this.el.resetBtn.addEventListener('click', () => this._resetData());
  }

  _switchTab(tab) {
    this.el.tabs.forEach(t => t.classList.remove('active'));
    this.el.panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
  }

  _showToast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.add('show');
    setTimeout(() => this.el.toast.classList.remove('show'), 2000);
  }

  async _load() {
    const data = await MessagingService.getData();
    if (!data) return;
    this._render(data.settings, data.spending);
  }

  _render(settings, spending) {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTx    = (spending.transactions || []).filter(t => new Date(t.date) >= monthStart);

    this.el.toggleEnabled.checked = settings.enabled !== false;

    renderDashboard(this.el, settings, spending);
    renderHistory(this.el.historyList, monthTx);
    renderSettings(this.el, settings);
  }

  async _toggleProtection(enabled) {
    const data     = await MessagingService.getData();
    const settings = { ...(data?.settings || {}), enabled };
    await MessagingService.updateSettings(settings);
    this._showToast(enabled ? '🛡️ Protection on' : '⚠️ Protection off');
  }

  async _saveSettings() {
    const data     = await MessagingService.getData();
    const settings = { ...(data?.settings || {}), ...getSettingsValues(this.el) };
    await MessagingService.updateSettings(settings);
    this._showToast('✓ Saved');
    await this._load();
  }

  async _resetData() {
    if (!confirm('Reset all spending data?')) return;
    await MessagingService.resetSpending();
    this._showToast('🔄 Reset');
    await this._load();
  }
}

// Module scripts are deferred — DOM is ready by the time this runs
new PopupController();
