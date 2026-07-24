import { apiFetch, clearAuthToken, saveAuthToken } from "./api";

const saveSession = (response, rememberMe = false) => {
  if (response.token) saveAuthToken(response.token, rememberMe);
  return response;
};

export const loginRequest = async ({ email, password, rememberMe = false }) =>
  saveSession(
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    }),
    rememberMe,
  );

export const googleLoginRequest = async ({ credential, rememberMe = false }) =>
  saveSession(
    await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, rememberMe }),
    }),
    rememberMe,
  );

export const registerRequest = (payload) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const verifyEmailRequest = (token) =>
  apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

export const resendVerificationRequest = (email) =>
  apiFetch("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const forgotPasswordRequest = (email) =>
  apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPasswordRequest = (token, password) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });

export const fetchCurrentUser = async () => apiFetch("/auth/me");

export const updateProfileRequest = async (updates) =>
  apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

export const logoutRequest = () => clearAuthToken();
