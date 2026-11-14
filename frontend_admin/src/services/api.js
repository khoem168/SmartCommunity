export const API_BASE_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/+$/, "");

const TOKEN_KEY = "smartCommunityAdminToken";

export const getToken = () =>
  window.sessionStorage.getItem(TOKEN_KEY) ||
  window.localStorage.getItem(TOKEN_KEY);

export const saveToken = (token, remember = false) => {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(
    TOKEN_KEY,
    token,
  );
};

export const clearToken = () => {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
};

export const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot reach the administration API. Check that the backend is running and VITE_API_URL is correct.",
    );
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(
      payload?.error || payload?.message ||
      (response.status >= 500
        ? "The server is temporarily unavailable. Please try again later."
        : "The request could not be completed."),
    );
    error.status = response.status;
    error.code = payload?.code || (response.status >= 500 ? "SERVER_UNAVAILABLE" : undefined);
    throw error;
  }
  if (!isJson && response.status !== 204) {
    const error = new Error("The server returned an unexpected response. Please try again later.");
    error.code = "INVALID_API_RESPONSE";
    error.status = response.status;
    throw error;
  }
  return payload;
};

const query = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : "";
};

export const loginAdmin = async (credentials) => {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  if (response.user?.role !== "admin") {
    throw new Error("This workspace is restricted to administrator accounts.");
  }
  saveToken(response.token, credentials.rememberMe);
  return response.user;
};

export const fetchCurrentAdmin = () => apiFetch("/auth/me");
export const fetchDashboard = () => apiFetch("/admin/dashboard");
export const fetchAnalytics = (range = "30d") =>
  apiFetch(`/admin/analytics?range=${encodeURIComponent(range)}`);
export const fetchUsers = (filters) =>
  apiFetch(`/admin/users${query(filters)}`);
export const updateUser = (userId, updates) =>
  apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
export const fetchMentors = (filters) =>
  apiFetch(`/admin/mentor-applications${query(filters)}`);
export const reviewMentor = (id, review) =>
  apiFetch(`/admin/mentor-applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(review),
  });
export const fetchCompanies = (filters) =>
  apiFetch(`/admin/companies${query(filters)}`);
export const reviewCompany = (id, review) =>
  apiFetch(`/admin/companies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(review),
  });
export const fetchInternships = (filters) =>
  apiFetch(`/admin/internships${query(filters)}`);
export const updateInternship = (id, updates) =>
  apiFetch(`/admin/internships/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
export const fetchAuditLogs = (filters) =>
  apiFetch(`/admin/audit-logs${query(filters)}`);

export const downloadReport = async (report) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/reports/${report}.csv`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Unable to download this report.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] ||
    `smart-community-${report}.csv`;
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
};
