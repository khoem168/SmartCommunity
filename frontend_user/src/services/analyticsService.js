import { apiFetch } from "./api";

export const fetchAdminAnalytics = (range = "30d") =>
  apiFetch(`/admin/analytics?range=${encodeURIComponent(range)}`);
