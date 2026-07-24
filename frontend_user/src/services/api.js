export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      data?.error || data?.message || response.statusText || "Request failed.";
    const error = new Error(message);
    error.response = response;
    error.body = data;
    error.code = data?.code;
    throw error;
  }

  return data;
};
