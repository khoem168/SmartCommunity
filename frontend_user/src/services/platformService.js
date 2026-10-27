import { apiFetch } from "./api";

export const fetchStats = async () => apiFetch("/stats");

export const fetchDashboard = () => apiFetch("/dashboard");

export const fetchMembers = async () => {
  const response = await apiFetch("/members");
  return response.members || [];
};

export const fetchMentors = async (filters = {}) => {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.skill) search.set("skill", filters.skill);
  const response = await apiFetch(
    `/mentors${search.toString() ? `?${search.toString()}` : ""}`,
  );
  return response.mentors || [];
};

export const fetchMentorDetail = (mentorId) => apiFetch(`/mentors/${mentorId}`);

export const createMentorshipRequest = async (payload) =>
  apiFetch("/mentorships", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchMentorships = async () => {
  const response = await apiFetch("/mentorships");
  return response.mentorships || [];
};

export const updateMentorshipStatusRequest = (mentorshipId, payload) =>
  apiFetch(`/mentorships/${mentorshipId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const submitMentorReviewRequest = (mentorshipId, payload) =>
  apiFetch(`/mentorships/${mentorshipId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchMyMentorApplication = () =>
  apiFetch("/mentor-applications/me");

export const submitMentorApplicationRequest = (payload) =>
  apiFetch("/mentor-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchMentorApplications = async (status = "pending") => {
  const response = await apiFetch(
    `/mentor-applications?status=${encodeURIComponent(status)}`,
  );
  return response.applications || [];
};

export const reviewMentorApplicationRequest = (applicationId, payload) =>
  apiFetch(`/mentor-applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchInternships = async (filters = {}) => {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.type) search.set("type", filters.type);
  if (filters.remote) search.set("remote", "true");
  const response = await apiFetch(
    `/internships${search.toString() ? `?${search.toString()}` : ""}`,
  );
  return response.internships || [];
};

export const createInternshipRequest = async (payload) =>
  apiFetch("/internships", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const applyInternshipRequest = async (internshipId, payload) => {
  const formData = new FormData();
  formData.append("resume", payload.resume);
  formData.append("coverLetter", payload.coverLetter || "");
  formData.append("portfolioUrl", payload.portfolioUrl || "");
  return apiFetch(`/internships/${internshipId}/apply`, {
    method: "POST",
    body: formData,
  });
};

export const fetchCompanyProfile = () => apiFetch("/company-profile/me");

export const saveCompanyProfileRequest = (payload) =>
  apiFetch("/company-profile/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const uploadCompanyLogoRequest = (logo) => {
  const formData = new FormData();
  formData.append("logo", logo);
  return apiFetch("/company-profile/logo", { method: "POST", body: formData });
};

export const fetchRecruiterInternships = async () => {
  const response = await apiFetch("/internships/manage");
  return response.internships || [];
};

export const updateInternshipStatusRequest = (internshipId, status) =>
  apiFetch(`/internships/${internshipId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const fetchInternshipApplications = async () => {
  const response = await apiFetch("/internship-applications");
  return response;
};

export const updateInternshipApplicationStatusRequest = (
  applicationId,
  payload,
) =>
  apiFetch(`/internship-applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const fetchSkillExchanges = async () => {
  const response = await apiFetch("/skill-exchanges");
  return response.exchanges || [];
};

export const fetchCommunitySkillExchanges = async () => {
  const response = await apiFetch("/skill-exchanges/community");
  return response.exchanges || [];
};

export const createSkillExchangeRequest = async (payload) =>
  apiFetch("/skill-exchanges", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchSkillMatches = () => apiFetch("/skill-matches");

export const fetchSkillExchangeDetail = (exchangeId) =>
  apiFetch(`/skill-exchanges/${exchangeId}`);

export const fetchSkillLearningHistory = () =>
  apiFetch("/skill-exchanges/history");

export const updateSkillExchangeProgressRequest = (exchangeId, payload) =>
  apiFetch(`/skill-exchanges/${exchangeId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const confirmSkillExchangeCompletionRequest = (exchangeId, note = "") =>
  apiFetch(`/skill-exchanges/${exchangeId}/complete`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

export const bookSkillExchangeRequest = async (exchangeId, payload = {}) =>
  apiFetch(`/skill-exchanges/${exchangeId}/book`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const updateSkillExchangeStatusRequest = async (exchangeId, payload) =>
  apiFetch(`/skill-exchanges/${exchangeId}/status`, {
    method: "PATCH",
    body: JSON.stringify(
      typeof payload === "string" ? { status: payload } : payload,
    ),
  });
