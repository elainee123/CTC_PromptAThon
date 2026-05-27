/**
 * ServiceConfig defines the active data storage strategy and settings.
 * Switch `MODE` to 'api' to hook up your backend server.
 */
export const ServiceConfig = {
  // Toggle between:
  // - 'local': uses browser extension chrome.storage.local
  // - 'api'  : calls a remote server via fetch (Express, FastAPI, Rails, etc.)
  MODE: 'local',

  // Base endpoint for your remote backend
  API_BASE_URL: 'http://localhost:3000/api',

  // Common headers required by your backend (e.g., auth, response formatting)
  API_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    // 'Authorization': 'Bearer <YOUR_USER_SESSION_TOKEN_HERE>'
  }
};
