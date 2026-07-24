import { API_BASE_URL, apiFetch, getAuthToken } from "./api";

const queryString = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  const value = params.toString();
  return value ? `?${value}` : "";
};

export const fetchAdminDashboard = () => apiFetch("/admin/dashboard");

export const fetchAdminUsers = (filters) =>
  apiFetch(`/admin/users${queryString(filters)}`);

export const updateAdminUser = (userId, updates) =>
  apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const fetchAdminMentorApplications = (filters) =>
  apiFetch(`/admin/mentor-applications${queryString(filters)}`);

export const reviewAdminMentorApplication = (applicationId, review) =>
  apiFetch(`/admin/mentor-applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify(review),
  });

export const fetchAdminCompanies = (filters) =>
  apiFetch(`/admin/companies${queryString(filters)}`);

export const reviewAdminCompany = (companyId, review) =>
  apiFetch(`/admin/companies/${companyId}`, {
    method: "PATCH",
    body: JSON.stringify(review),
  });

export const fetchAdminInternships = (filters) =>
  apiFetch(`/admin/internships${queryString(filters)}`);

export const updateAdminInternship = (internshipId, updates) =>
  apiFetch(`/admin/internships/${internshipId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const fetchAdminAuditLogs = (filters) =>
  apiFetch(`/admin/audit-logs${queryString(filters)}`);

export const downloadAdminReport = async (report) => {
  const response = await fetch(`${API_BASE_URL}/admin/reports/${report}.csv`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Unable to download the report.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename =
    disposition.match(/filename="([^"]+)"/)?.[1] ||
    `smart-community-${report}.csv`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
