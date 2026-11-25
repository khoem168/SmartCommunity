const express = require("express");
const {
  forgotPassword,
  googleLogin,
  login,
  me,
  register,
  resendVerification,
  resetPassword,
  updateProfile,
  verifyEmail,
  verifyTwoFactorLogin,
  pollTelegramApproval,
} = require("../controllers/authController");
const twoFactorController = require("../controllers/twoFactorController");
const passkeys = require("../controllers/passkeyController");
const { buildAuthResponse, userColumns } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { authLimiter, loginLimiter, tokenRequestLimiter } = require("../middleware/rateLimits");

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/google", loginLimiter, googleLogin);
router.post("/verify-email", tokenRequestLimiter, verifyEmail);
router.post("/resend-verification", tokenRequestLimiter, resendVerification);
router.post("/forgot-password", tokenRequestLimiter, forgotPassword);
router.post("/reset-password", tokenRequestLimiter, resetPassword);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);

// Two-factor authentication (authenticator app codes) & Telegram 1-Tap Super Admin verification
router.post("/2fa/verify", loginLimiter, verifyTwoFactorLogin);
router.post("/telegram-approval/poll", pollTelegramApproval);
router.get("/2fa/status", requireAuth, twoFactorController.getStatus);
router.post("/2fa/setup", requireAuth, twoFactorController.startSetup);
router.post("/2fa/enable", requireAuth, authLimiter, twoFactorController.confirmSetup);
router.post("/2fa/disable", requireAuth, authLimiter, twoFactorController.disable);
router.post("/2fa/recovery-codes", requireAuth, authLimiter, twoFactorController.regenerateRecoveryCodes);

// Passkeys (fingerprint / face / screen-lock sign-in)
router.post("/passkeys/login/options", loginLimiter, passkeys.loginOptions);
router.post("/passkeys/login/verify", loginLimiter, passkeys.makeLoginVerify({ buildAuthResponse, userColumns }));
router.get("/passkeys", requireAuth, passkeys.list);
router.post("/passkeys/register/options", requireAuth, authLimiter, passkeys.registrationOptions);
router.post("/passkeys/register/verify", requireAuth, authLimiter, passkeys.registrationVerify);
router.delete("/passkeys/:passkeyId", requireAuth, passkeys.remove);

module.exports = router;
