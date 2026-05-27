(() => {
  "use strict";

  // ─── Messaging ──────────────────────────────────────────────────────────────

  function sendMsg(type, extra) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...extra }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn("[IB]", chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(res);
      });
    });
  }

  const API = {
    getData: () => sendMsg("GET_DATA"),
    updateSettings: (settings) => sendMsg("UPDATE_SETTINGS", { settings }),
    resetSpending: () => sendMsg("RESET_SPENDING"),
  };

  // ─── Dashboard view ─────────────────────────────────────────────────────────

  function renderDashboard(el, settings, spending) {
    const budget = settings.monthlyBudget || 2000;
    const spent = spending.totalThisMonth || 0;
    const remaining = Math.max(0, budget - spent);
    const pct = Math.min((spent / budget) * 100, 100);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTx = (spending.transactions || []).filter(
      (t) => new Date(t.date) >= monthStart,
    );
    const blocked = monthTx.filter((t) => t.wasBlocked !== false).length;

    el.statSpent.textContent = `$${spent.toFixed(0)}`;
    el.statLeft.textContent = `$${remaining.toFixed(0)}`;
    el.statBlocked.textContent = blocked;
    el.statBobas.textContent = Math.floor(remaining / 7.5);

    const circumference = 314.16;
    const color = pct > 80 ? "#F87171" : pct > 50 ? "#FBBF24" : "#34D399";
    el.ringFill.style.stroke = color;
    setTimeout(() => {
      el.ringFill.style.strokeDashoffset =
        circumference - (pct / 100) * circumference;
    }, 50);
    el.ringPct.textContent = `${Math.round(pct)}%`;
    el.ringPct.style.color = color;
  }

  // ─── History view ───────────────────────────────────────────────────────────

  function renderHistory(container, transactions) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTx = [...transactions]
      .filter((t) => new Date(t.date) >= monthStart)
      .reverse();

    if (!monthTx.length) {
      container.innerHTML =
        '<div class="empty"><span>✨</span><p>No purchases this month — keep it up!</p></div>';
      return;
    }

    container.innerHTML = monthTx
      .map((t) => {
        const date = new Date(t.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const blocked = t.wasBlocked !== false;
        return `
        <div class="history-item">
          <div class="history-icon">${blocked ? "🛡️" : "🛒"}</div>
          <div class="history-info">
            <div class="history-site">${t.site || "Unknown"}</div>
            <div class="history-date">${date}</div>
          </div>
          <div class="${blocked ? "history-amount val-green" : "history-amount"}">
            ${blocked ? "Saved $" : "-$"}${(t.amount || 0).toFixed(2)}
          </div>
        </div>`;
      })
      .join("");
  }

  // ─── Settings view ──────────────────────────────────────────────────────────

  function renderSettings(el, settings) {
    el.setBudget.value = settings.monthlyBudget || 2000;
    el.setCooldown.value = settings.cooldownSeconds || 30;
  }

  function getSettingsValues(el) {
    return {
      monthlyBudget: parseFloat(el.setBudget.value) || 2000,
      cooldownSeconds: parseInt(el.setCooldown.value, 10) || 30,
    };
  }

  // ─── Controller ─────────────────────────────────────────────────────────────

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

    _toast(msg) {
      this.el.toast.textContent = msg;
      this.el.toast.classList.add("show");
      setTimeout(() => this.el.toast.classList.remove("show"), 2000);
    }

    async _load() {
      const data = await API.getData();
      if (!data) return;
      const { settings, spending } = data;
      this.el.toggleEnabled.checked = settings.enabled !== false;
      renderDashboard(this.el, settings, spending);
      renderHistory(this.el.historyList, spending.transactions || []);
      renderSettings(this.el, settings);
    }

    async _toggleProtection(enabled) {
      const data = await API.getData();
      if (!data) {
        this._toast("⚠️ Could not reach extension");
        return;
      }
      await API.updateSettings({ ...data.settings, enabled });
      this._toast(enabled ? "🛡️ Protection on" : "⚠️ Protection off");
    }

    async _saveSettings() {
      const data = await API.getData();
      if (!data) {
        this._toast("⚠️ Could not save");
        return;
      }
      await API.updateSettings({
        ...data.settings,
        ...getSettingsValues(this.el),
      });
      this._toast("✓ Saved");
      await this._load();
    }

    async _resetData() {
      if (!confirm("Reset all spending data?")) return;
      const res = await API.resetSpending();
      if (!res) {
        this._toast("⚠️ Could not reset");
        return;
      }
      this._toast("🔄 Reset");
      await this._load();
    }
  }

  document.addEventListener("DOMContentLoaded", () => new PopupController());
})();
