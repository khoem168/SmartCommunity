import { apiFetch } from "./api";

export const fetchCourses = () => apiFetch("/courses");

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
