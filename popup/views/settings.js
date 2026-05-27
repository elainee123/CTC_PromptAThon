/**
 * Populates the settings form fields with stored values.
 *
 * @param {Object} elements - Cached DOM element references from PopupController.
 * @param {Object} settings - Extension settings to display.
 */
export function renderSettings(elements, settings) {
  elements.setBudget.value   = settings.monthlyBudget  || 2000;
  elements.setCooldown.value = settings.cooldownSeconds || 30;
}

/**
 * Reads the current settings form values and returns them as a plain object.
 *
 * @param {Object} elements - Cached DOM element references from PopupController.
 * @returns {{ monthlyBudget: number, cooldownSeconds: number }}
 */
export function getSettingsValues(elements) {
  return {
    monthlyBudget:   parseFloat(elements.setBudget.value)   || 2000,
    cooldownSeconds: parseInt(elements.setCooldown.value, 10) || 30,
  };
}
