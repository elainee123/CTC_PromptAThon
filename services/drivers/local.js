/**
 * LocalDriver implements the storage interface using chrome.storage.local.
 * This is the default driver for browser-extension deployments.
 *
 * To add a remote backend, create a new driver (e.g. api.js) that implements
 * the same get() / set() interface using fetch(), then switch the active driver
 * in services/config.js by setting MODE to 'api'.
 */
export class LocalDriver {
  get(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  set(data) {
    return new Promise(resolve => chrome.storage.local.set(data, resolve));
  }
}
