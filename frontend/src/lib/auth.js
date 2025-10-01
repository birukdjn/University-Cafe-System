// Minimal auth helper using localStorage (replace with cookies for more security in production)
// All access to window/localStorage is guarded so these functions are safe to import
// from server-side code (they will simply return null/false on the server).
export const setTokens = (tokens) => {
  if (typeof window === 'undefined') return;
  try {
    if (tokens?.access) window.localStorage.setItem('access_token', tokens.access);
    if (tokens?.refresh) window.localStorage.setItem('refresh_token', tokens.refresh);
  } catch (e) {
    // ignore storage errors (e.g., in private browsing)
    // console.warn('setTokens storage error', e);
  }
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem('access_token'); } catch (e) { return null; }
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem('refresh_token'); } catch (e) { return null; }
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
  } catch (e) {
    // ignore
  }
};

export const isAuthenticated = () => !!getAccessToken();
