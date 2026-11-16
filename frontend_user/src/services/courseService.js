import { apiFetch } from "./api";

export const fetchCourses = () => apiFetch("/courses");

// Lesson completion and certificates
export const fetchCourseProgress = (courseSlug) =>
  apiFetch(`/courses/${encodeURIComponent(courseSlug)}/progress`);
export const markLessonComplete = (courseSlug, lessonId) =>
  apiFetch(`/courses/${encodeURIComponent(courseSlug)}/lessons/${lessonId}/complete`, { method: "POST", body: "{}" });
export const unmarkLessonComplete = (courseSlug, lessonId) =>
  apiFetch(`/courses/${encodeURIComponent(courseSlug)}/lessons/${lessonId}/complete`, { method: "DELETE" });
export const fetchCertificate = (code) => apiFetch(`/certificates/${encodeURIComponent(code)}`);
export const fetchMyCertificates = () => apiFetch("/certificates/mine");

export const fetchCourse = (courseSlug) =>
  apiFetch(`/courses/${encodeURIComponent(courseSlug)}`);

export const fetchCourseLesson = (courseSlug, lessonId) =>
  apiFetch(
    `/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonId)}`,
  );

export const createKhqrCoursePayment = (courseId) =>
  apiFetch(`/courses/${encodeURIComponent(courseId)}/payments/khqr`, {
    method: "POST",
  });

export const verifyKhqrCoursePayment = (paymentId) =>
  apiFetch(`/course-payments/${encodeURIComponent(paymentId)}/verify`, {
    method: "POST",
  });
