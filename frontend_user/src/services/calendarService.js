import { apiFetch } from "./api";

/**
 * Fetch unified calendar events for authenticated user
 * @param {Object} filters { from, to }
 */
export const fetchCalendarEvents = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);

  const qs = query.toString();
  const path = `/calendar/events${qs ? `?${qs}` : ""}`;
  return apiFetch(path);
};
