import { apiFetch } from "./api";

export const fetchCareerPaths = async () => {
  const response = await apiFetch("/career/paths");
  return response.paths || [];
};

export const fetchCareerPath = (pathId) => apiFetch(`/career/paths/${pathId}`);

export const fetchCareerOverview = () => apiFetch("/career/overview");

export const fetchCareerBridge = () => apiFetch("/career/bridge");

export const startCareerRoadmapRequest = (pathId) =>
  apiFetch("/career/roadmaps", {
    method: "POST",
    body: JSON.stringify({ pathId }),
  });

export const updateCareerRoadmapStepRequest = (roadmapId, stepId, completed) =>
  apiFetch(`/career/roadmaps/${roadmapId}/steps/${stepId}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });

export const fetchCareerArticles = async (category = "") => {
  const response = await apiFetch(
    `/career/articles${category ? `?category=${encodeURIComponent(category)}` : ""}`,
  );
  return response.articles || [];
};

export const fetchCareerArticle = (slug) =>
  apiFetch(`/career/articles/${slug}`);

export const fetchCareerAssessments = async () => {
  const response = await apiFetch("/career/assessments");
  return response.assessments || [];
};

export const fetchCareerAssessment = (assessmentId) =>
  apiFetch(`/career/assessments/${assessmentId}`);

export const submitCareerAssessmentRequest = (assessmentId, answers) =>
  apiFetch(`/career/assessments/${assessmentId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
