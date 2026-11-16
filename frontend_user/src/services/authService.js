import { apiFetch, clearAuthToken, saveAuthToken } from "./api";

// "Trust this device for 30 days" token from the two-factor step. It only
// skips the code; the password (or Google) is still required.
const TRUSTED_DEVICE_KEY = "smartCommunityTrustedDevice";
const readTrustedDevice = () => {
  try {
    return window.localStorage.getItem(TRUSTED_DEVICE_KEY) || undefined;
  } catch {
    return undefined;
  }
};
const saveTrustedDevice = (token) => {
  try {
    if (token) window.localStorage.setItem(TRUSTED_DEVICE_KEY, token);
  } catch {
    // Storage blocked: the user is simply asked for a code next time.
  }
};

const saveSession = (response, rememberMe = false) => {
  if (response.token) saveAuthToken(response.token, rememberMe);
  return response;
};

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const loginRequest = async ({ email, password, rememberMe = false }) => {
  const retryDelays = [0, 1500, 3000];
  let lastError;

  for (const delay of retryDelays) {
    if (delay) await wait(delay);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe, trustedDeviceToken: readTrustedDevice() }),
      });
      return saveSession(response, rememberMe);
    } catch (error) {
      lastError = error;
      const isTemporaryServerError = [502, 503, 504].includes(
        error.response?.status,
      );
      if (error.code !== "NETWORK_ERROR" && !isTemporaryServerError) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const googleLoginRequest = async ({ credential, rememberMe = false }) =>
  saveSession(
    await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, rememberMe, trustedDeviceToken: readTrustedDevice() }),
    }),
    rememberMe,
  );

// Second step of a sign-in for accounts with two-factor authentication.
export const verifyTwoFactorRequest = async ({ challengeToken, code, recoveryCode, trustDevice, rememberMe }) => {
  const response = await apiFetch("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ challengeToken, code, recoveryCode, trustDevice: Boolean(trustDevice) }),
  });
  if (response.trustedDevice?.token) saveTrustedDevice(response.trustedDevice.token);
  return saveSession(response, response.rememberMe ?? rememberMe);
};

export const twoFactorStatusRequest = () => apiFetch("/auth/2fa/status");
export const twoFactorSetupRequest = () => apiFetch("/auth/2fa/setup", { method: "POST", body: "{}" });
export const twoFactorEnableRequest = (code) =>
  apiFetch("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
export const twoFactorDisableRequest = ({ password, code, recoveryCode }) =>
  apiFetch("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ password, code, recoveryCode }) });
export const twoFactorRecoveryCodesRequest = (code) =>
  apiFetch("/auth/2fa/recovery-codes", { method: "POST", body: JSON.stringify({ code }) });

export const registerRequest = async (payload) => {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return saveSession(response, true);
};

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
