import { apiFetch } from "./api";

export const listLearningSessions = async (filters = {}) => {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  return apiFetch(`/learning-sessions?${search.toString()}`);
};

export const getLearningSession = async (sessionId) =>
  apiFetch(`/learning-sessions/${sessionId}`);

export const createLearningSession = (payload) =>
  apiFetch("/learning-sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const registerForLearningSession = (sessionId) =>
  apiFetch(`/learning-sessions/${sessionId}/register`, { method: "POST" });

export const cancelLearningSessionRegistration = (sessionId) =>
  apiFetch(`/learning-sessions/${sessionId}/register`, { method: "DELETE" });

export const updateLearningSessionStatus = (sessionId, payload) =>
  apiFetch(`/learning-sessions/${sessionId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const joinLearningSession = (sessionId) =>
  apiFetch(`/learning-sessions/${sessionId}/attendance/join`, {
    method: "POST",
  });

export const leaveLearningSession = (sessionId) =>
  apiFetch(`/learning-sessions/${sessionId}/attendance/leave`, {
    method: "POST",
  });

export const getLearningSessionParticipants = async (sessionId) => {
  const response = await apiFetch(
    `/learning-sessions/${sessionId}/participants`,
  );
  return response.participants || [];
};

export const submitLearningSessionFeedback = (sessionId, payload) =>
  apiFetch(`/learning-sessions/${sessionId}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
