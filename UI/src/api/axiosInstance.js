import axios from "axios";

// ── Base URL — set VITE_API_URL in your .env to override this ──────────
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://localhost:7043/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEY = "hh_token";

/**
 * Decodes a JWT's payload without any extra library,
 * and returns whether it's expired.
 */
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payloadBase64 = token.split(".")[1];

    // JWTs use base64url — swap chars before atob,
    // and pad if needed.
    const normalized = payloadBase64
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    const payload = JSON.parse(atob(padded));

    if (!payload.exp) return false;

    const expiryMs = payload.exp * 1000;

    return Date.now() >= expiryMs;
  } catch {
    // Malformed/unreadable token → treat as expired
    return true;
  }
}

/**
 * Clears the session and sends the user to /login.
 */
function logoutAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

/**
 * Attach auth token automatically if a valid token exists.
 *
 * IMPORTANT:
 * - No token → API call continues without Authorization
 * - Valid token → Authorization header is added
 * - Expired token → logout
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    // ─────────────────────────────────────────────
    // 1. NO TOKEN
    // ─────────────────────────────────────────────
    // Allow API request without Authorization header.
    if (!token) {
      return config;
    }

    // ─────────────────────────────────────────────
    // 2. TOKEN EXISTS BUT EXPIRED
    // ─────────────────────────────────────────────
    if (isTokenExpired(token)) {
      logoutAndRedirect();

      return Promise.reject(new axios.Cancel("Session expired"));
    }

    // ─────────────────────────────────────────────
    // 3. TOKEN EXISTS AND IS VALID
    // ─────────────────────────────────────────────
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Handle server-side authentication failures.
 *
 * If backend returns 401, logout the user.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logoutAndRedirect();
    }

    return Promise.reject(error);
  }
);

/**
 * Also check token expiry when the browser tab
 * becomes visible again.
 */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const token = localStorage.getItem(TOKEN_KEY);

    // Only check expiry if a token actually exists.
    if (token && isTokenExpired(token)) {
      logoutAndRedirect();
    }
  }
});

export default axiosInstance;