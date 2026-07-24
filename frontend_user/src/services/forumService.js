import { apiFetch } from "./api";

export const fetchForumCategories = async () => {
  const response = await apiFetch("/forum/categories");
  return response.categories || [];
};

export const fetchForumPosts = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return apiFetch(`/forum/posts${query ? `?${query}` : ""}`);
};

export const fetchForumPost = (postId) => apiFetch(`/forum/posts/${postId}`);

export const createForumPostRequest = (payload) =>
  apiFetch("/forum/posts", { method: "POST", body: JSON.stringify(payload) });

export const updateForumPostRequest = (postId, payload) =>
  apiFetch(`/forum/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteForumPostRequest = (postId) =>
  apiFetch(`/forum/posts/${postId}`, { method: "DELETE" });

export const createForumAnswerRequest = (postId, body) =>
  apiFetch(`/forum/posts/${postId}/answers`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

export const createForumCommentRequest = (postId, body) =>
  apiFetch(`/forum/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

export const toggleForumPostLikeRequest = (postId) =>
  apiFetch(`/forum/posts/${postId}/like`, { method: "POST" });

export const toggleForumAnswerLikeRequest = (answerId) =>
  apiFetch(`/forum/answers/${answerId}/like`, { method: "POST" });

export const acceptForumAnswerRequest = (answerId) =>
  apiFetch(`/forum/answers/${answerId}/accept`, { method: "POST" });

export const deleteForumAnswerRequest = (answerId) =>
  apiFetch(`/forum/answers/${answerId}`, { method: "DELETE" });

export const deleteForumCommentRequest = (commentId) =>
  apiFetch(`/forum/comments/${commentId}`, { method: "DELETE" });
