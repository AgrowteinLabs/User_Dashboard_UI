// src/utils/api.js — automatic session refresh for fetch() and axios.
//
// The access token lives in an httpOnly cookie and expires after 15 minutes.
// On any 401 (other than auth endpoints) this layer:
//   1. calls POST /auth/refresh once (the httpOnly refresh cookie rides along;
//      the server rotates both cookies) — concurrent 401s share a single call
//   2. retries the original request with the rotated cookies
//   3. if the server rejects the refresh (session dead) → redirect to /login;
//      network failures do NOT log the user out
//
// Call installRefreshLayer() once at app startup (see src/main.jsx).

import axios from "axios";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;
const REFRESH_URL = `${API_URL}/api/v1/auth/refresh`;

let refreshPromise = null;
let originalFetch = null;

const isAuthPath = (url = "") =>
  String(url).includes("/auth/login") ||
  String(url).includes("/auth/refresh") ||
  String(url).includes("/auth/logout");

// Single-flight refresh: parallel 401s share one refresh call.
const refreshSession = () => {
  if (!originalFetch) installRefreshLayer();
  if (!refreshPromise) {
    refreshPromise = originalFetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => {
        if (!res.ok) {
          const err = new Error("Session refresh failed");
          err.status = res.status; // server rejected the session
          throw err;
        }
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const clearSession = () => {
  localStorage.removeItem("userId");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("selectedProductUid");
  localStorage.removeItem("homepagePreference");
  localStorage.removeItem("token");
};

const forceLogout = () => {
  clearSession();
  if (window.location.pathname !== "/login") window.location.href = "/login";
};

// fetch wrapper with refresh-on-401. API-compatible with window.fetch.
const wrapFetch = async (input, init = {}) => {
  if (!originalFetch) installRefreshLayer();
  const opts = { ...init, credentials: init.credentials || "include" };
  const url = typeof input === "string" ? input : input.url;
  const doFetch = () =>
    originalFetch(input instanceof Request ? input.clone() : input, opts);

  let res = await doFetch();
  if (res.status === 401 && !opts._retried && !isAuthPath(url)) {
    opts._retried = true;
    try {
      await refreshSession();
      res = await doFetch();
    } catch (err) {
      // Only log out when the server explicitly rejected the session
      // (401/403). Transient 500/429 from /auth/refresh must not log out.
      if (err && (err.status === 401 || err.status === 403)) forceLogout();
    }
  }
  return res;
};

const makeAxiosInterceptor = (retry) => [
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    if (!response || response.status !== 401) return Promise.reject(error);
    const url = (config?.baseURL || "") + (config?.url || "");
    if (config?._retried || isAuthPath(url)) return Promise.reject(error);
    config._retried = true;
    try {
      await refreshSession();
      return retry(config);
    } catch (err) {
      if (err && (err.status === 401 || err.status === 403)) forceLogout();
      return Promise.reject(error);
    }
  },
];

// Named axios instance for new code.
export const apiClient = axios.create({ withCredentials: true });
apiClient.interceptors.response.use(...makeAxiosInterceptor((c) => apiClient(c)));

// Explicit fetch wrapper for new code (same behavior as the global patch).
export const apiFetch = wrapFetch;

// Wire everything up. Safe to call more than once.
export const installRefreshLayer = () => {
  if (originalFetch) return; // already installed
  originalFetch = window.fetch.bind(window);
  window.fetch = wrapFetch;
  axios.defaults.withCredentials = true;
  // Cover the module-level axios instance used by existing code.
  axios.interceptors.response.use(...makeAxiosInterceptor((c) => axios(c)));
};
