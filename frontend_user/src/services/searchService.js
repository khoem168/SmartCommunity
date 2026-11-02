import { apiFetch } from "./api";

/**
 * Perform a unified global search across Courses, Mentors, Jobs, Skill Exchange, and Community
 * @param {Object} params - Query parameters
 * @param {string} [params.q] - Search query text
 * @param {string} [params.type] - Category type ('all', 'courses', 'mentors', 'jobs', 'skills', 'community')
 * @param {string} [params.category] - Subcategory filter
 * @param {string} [params.level] - Skill level filter (e.g. 'beginner', 'intermediate', 'advanced')
 * @param {string} [params.price] - Price filter ('All', 'Free', 'Paid')
 * @param {string} [params.jobType] - Job type filter (e.g. 'full_time', 'internship')
 * @param {string} [params.sort] - Sort order ('relevance', 'newest', 'price-low', 'price-high')
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit] - Page limit
 * @param {AbortSignal} [signal] - Optional AbortController signal
 */
export const fetchGlobalSearch = async (params = {}, signal = null) => {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q.trim());
  if (params.type && params.type !== "all") search.set("type", params.type);
  if (params.category && params.category !== "All") search.set("category", params.category);
  if (params.level && params.level !== "All") search.set("level", params.level);
  if (params.price && params.price !== "All") search.set("price", params.price);
  if (params.jobType && params.jobType !== "All") search.set("jobType", params.jobType);
  if (params.sort && params.sort !== "relevance") search.set("sort", params.sort);
  if (params.page && Number(params.page) > 1) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return apiFetch(`/search${qs ? `?${qs}` : ""}`, {
    signal,
  });
};
