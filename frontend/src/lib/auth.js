// Minimal auth helper using localStorage (replace with cookies for more security in production)
export const setTokens = (tokens) => {
  if (tokens?.access) localStorage.setItem('access_token', tokens.access);
  if (tokens?.refresh) localStorage.setItem('refresh_token', tokens.refresh);
};

export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const clearTokens = () => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); };

export const isAuthenticated = () => !!getAccessToken();
