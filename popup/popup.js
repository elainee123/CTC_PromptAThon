import { MessagingService } from "../services/messaging.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderHistory } from "./views/history.js";
import { renderSettings, getSettingsValues } from "./views/settings.js";

/**
 * PopupController wires up tab navigation, global controls, and delegates
 * all rendering to the per-tab view modules.
 *
 * MessagingService always resolves (never rejects) — null means the background
 * was unreachable. Every method that calls the service guards against null so a
 * transient service-worker hiccup never silently corrupts stored settings.
 */
class PopupController {
  constructor() {
    this.el = {
      tabs: document.querySelectorAll(".tab"),
      panels: document.querySelectorAll(".panel"),
      toggleEnabled: document.getElementById("toggle-enabled"),
      ringFill: document.getElementById("ring-fill"),
      ringPct: document.getElementById("ring-pct"),
      statSpent: document.getElementById("stat-spent"),
      statLeft: document.getElementById("stat-left"),
      statBlocked: document.getElementById("stat-blocked"),
      statBobas: document.getElementById("stat-bobas"),
      historyList: document.getElementById("history-list"),
      setBudget: document.getElementById("set-budget"),
      setCooldown: document.getElementById("set-cooldown"),
      saveBtn: document.getElementById("save-btn"),
      resetBtn: document.getElementById("reset-btn"),
      toast: document.getElementById("toast"),
    };

    this._bindEvents();
    this._load();
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.el.tabs.forEach((tab) =>
      tab.addEventListener("click", () => this._switchTab(tab)),
    );
    this.el.toggleEnabled.addEventListener("change", (e) =>
      this._toggleProtection(e.target.checked),
    );
    this.el.saveBtn.addEventListener("click", () => this._saveSettings());
    this.el.resetBtn.addEventListener("click", () => this._resetData());
  }

  _switchTab(tab) {
    this.el.tabs.forEach((t) => t.classList.remove("active"));
    this.el.panels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document
      .getElementById(`panel-${tab.dataset.tab}`)
      ?.classList.add("active");
  }

  _showToast(msg) {
    this.el.toast.textContent = msg;
    this.el.toast.classList.add("show");
    setTimeout(() => this.el.toast.classList.remove("show"), 2000);
  }

  // ─── Data ───────────────────────────────────────────────────────────────────

  async _load() {
    const data = await MessagingService.getData();
    if (!data) return; // background unreachable — leave the UI at its default state
    this._render(data.settings, data.spending);
  }

  _render(settings, spending) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTx = (spending.transactions || []).filter(
      (t) => new Date(t.date) >= monthStart,
    );

    this.el.toggleEnabled.checked = settings.enabled !== false;

    renderDashboard(this.el, settings, spending);
    renderHistory(this.el.historyList, monthTx);
    renderSettings(this.el, settings);
  }

  async _toggleProtection(enabled) {
    const data = await MessagingService.getData();
    // Guard: if data is null and we merge with {}, we'd overwrite all stored
    // settings (budget, cooldown) with just { enabled }. Bail out instead.
    if (!data) {
      this._showToast("⚠️ Could not reach extension");
      return;
    }

    const settings = { ...data.settings, enabled };
    await MessagingService.updateSettings(settings);
    this._showToast(enabled ? "🛡️ Protection on" : "⚠️ Protection off");
  }

  async _saveSettings() {
    const data = await MessagingService.getData();
    // Same guard as _toggleProtection — a null merge would wipe stored settings.
    if (!data) {
      this._showToast("⚠️ Could not save");
      return;
    }

    const settings = { ...data.settings, ...getSettingsValues(this.el) };
    await MessagingService.updateSettings(settings);
    this._showToast("✓ Saved");
    await this._load();
  }

  async _resetData() {
    if (!confirm("Reset all spending data?")) return;
    const result = await MessagingService.resetSpending();
    if (!result) {
      this._showToast("⚠️ Could not reset");
      return;
    }
    this._showToast("🔄 Reset");
    await this._load();
  }
}

// Module scripts are deferred — DOM is already parsed when this runs
new PopupController();
