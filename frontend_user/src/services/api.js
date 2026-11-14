const configuredApiUrl =
  import.meta.env?.VITE_API_URL || "/api";

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");
const TOKEN_STORAGE_KEY = "smartCommunityToken";

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return (
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
    window.localStorage.getItem(TOKEN_STORAGE_KEY)
  );
};

export const saveAuthToken = (token, rememberMe = false) => {
  if (typeof window === "undefined") return;
  clearAuthToken();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const apiFetch = async (path, options = {}) => {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (cause) {
    if (cause?.name === "AbortError") {
      throw cause;
    }
    const error = new Error(
      "Cannot connect to the server. Check your internet connection and try again.",
    );
    error.code = "NETWORK_ERROR";
    error.cause = cause;
    throw error;
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.error || data?.message ||
      (response.status >= 500
        ? "The server is temporarily unavailable. Please try again later."
        : response.statusText || `Request failed (${response.status}).`);
    const error = new Error(message);
    error.response = response;
    error.body = data;
    error.code = data?.code || (response.status >= 500 ? "SERVER_UNAVAILABLE" : undefined);
    throw error;
  }

  if (!isJson && response.status !== 204) {
    const error = new Error("The server returned an unexpected response. Please try again later.");
    error.code = "INVALID_API_RESPONSE";
    error.response = response;
    throw error;
  }

  return data;
};
