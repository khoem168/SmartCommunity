// Passkeys (WebAuthn): sign in with a fingerprint, face or phone screen lock
// instead of a password. Challenges travel in short-lived signed tokens, so
// no server-side session store is needed on serverless hosting.
const jwt = require("jsonwebtoken");
const {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");
const db = require("../config/db");
const { noteSignIn } = require("../services/loginAlertService");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "local-development-secret-change-before-hosting");
const JWT_ISSUER = process.env.JWT_ISSUER || "smart-community-api";
const CHALLENGE_AUDIENCE = `${process.env.JWT_AUDIENCE || "smart-community-web"}:passkey`;
const RP_NAME = "Smart Community";

// The site's own address decides where passkeys work. APP_URL is the public
// site; PASSKEY_RP_ID / PASSKEY_ORIGINS override it when needed.
const relyingParty = () => {
  const appUrl = new URL(process.env.APP_URL || "http://localhost:5173");
  const origins = (process.env.PASSKEY_ORIGINS || appUrl.origin)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return { rpID: process.env.PASSKEY_RP_ID || appUrl.hostname, origins };
};

const toBase64Url = (bytes) => Buffer.from(bytes).toString("base64url");
const fromBase64Url = (text) => new Uint8Array(Buffer.from(text, "base64url"));

const signChallenge = (purpose, challenge, userId = null, extra = {}) =>
  jwt.sign({ purpose, challenge, ...extra }, JWT_SECRET, {
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: CHALLENGE_AUDIENCE,
    expiresIn: "5m",
    ...(userId ? { subject: String(userId) } : {}),
  });

const readChallenge = (token, purpose) => {
  try {
    const payload = jwt.verify(String(token || ""), JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: CHALLENGE_AUDIENCE,
    });
    return payload.purpose === purpose ? payload : null;
  } catch {
    return null;
  }
};

const listCredentials = async (userId) => {
  const [rows] = await db.query(
    "SELECT id, credential_id, transports, name, device_type, backed_up, created_at, last_used_at FROM user_passkeys WHERE user_id = ? ORDER BY created_at",
    [userId],
  );
  return rows;
};

const registrationOptions = async (req, res, next) => {
  try {
    const { rpID } = relyingParty();
    const existing = await listCredentials(req.user.id);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: req.user.email,
      userDisplayName: req.user.fullName || req.user.email,
      userID: new TextEncoder().encode(`user-${req.user.id}`),
      attestationType: "none",
      excludeCredentials: existing.map((row) => ({
        id: row.credential_id,
        transports: row.transports ? row.transports.split(",") : undefined,
      })),
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    });
    return res.json({ options, token: signChallenge("register", options.challenge, req.user.id) });
  } catch (error) {
    return next(error);
  }
};

const registrationVerify = async (req, res, next) => {
  try {
    const challenge = readChallenge(req.body.token, "register");
    if (!challenge || challenge.sub !== String(req.user.id)) {
      return res.status(400).json({ error: "This step expired. Try adding the passkey again.", code: "PASSKEY_CHALLENGE_EXPIRED" });
    }
    const { rpID, origins } = relyingParty();
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: req.body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch {
      return res.status(400).json({ error: "The passkey could not be verified.", code: "PASSKEY_INVALID" });
    }
    if (!verification.verified) {
      return res.status(400).json({ error: "The passkey could not be verified.", code: "PASSKEY_INVALID" });
    }
    const info = verification.registrationInfo;
    const name = String(req.body.name || "").trim().slice(0, 60) || "Passkey";
    await db.query(
      `INSERT INTO user_passkeys (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        info.credential.id,
        toBase64Url(info.credential.publicKey),
        info.credential.counter,
        (info.credential.transports || []).join(",") || null,
        info.credentialDeviceType,
        info.credentialBackedUp ? 1 : 0,
        name,
      ],
    );
    return res.json({ added: true });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "This passkey is already saved.", code: "PASSKEY_EXISTS" });
    }
    return next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const rows = await listCredentials(req.user.id);
    return res.json({
      passkeys: rows.map((row) => ({
        id: row.id,
        name: row.name,
        syncs: row.device_type === "multiDevice",
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM user_passkeys WHERE id = ? AND user_id = ?", [Number(req.params.passkeyId), req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Passkey not found." });
    return res.json({ removed: true });
  } catch (error) {
    return next(error);
  }
};

// Sign-in: the browser offers any passkey saved for this site, so the user
// does not even type an email.
const loginOptions = async (req, res, next) => {
  try {
    const { rpID } = relyingParty();
    const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
    return res.json({
      options,
      token: signChallenge("login", options.challenge, null, { rememberMe: Boolean(req.body?.rememberMe) }),
    });
  } catch (error) {
    return next(error);
  }
};

const makeLoginVerify = ({ buildAuthResponse, userColumns }) => async (req, res, next) => {
  try {
    const challenge = readChallenge(req.body.token, "login");
    if (!challenge) {
      return res.status(400).json({ error: "This step expired. Try again.", code: "PASSKEY_CHALLENGE_EXPIRED" });
    }
    const credentialId = typeof req.body.response?.id === "string" ? req.body.response.id : "";
    const [[stored]] = await db.query("SELECT * FROM user_passkeys WHERE credential_id = ?", [credentialId]);
    if (!stored) {
      return res.status(401).json({ error: "This passkey is not registered on Smart Community.", code: "PASSKEY_UNKNOWN" });
    }
    const { rpID, origins } = relyingParty();
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: req.body.response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: stored.credential_id,
          publicKey: fromBase64Url(stored.public_key),
          counter: Number(stored.counter),
          transports: stored.transports ? stored.transports.split(",") : undefined,
        },
      });
    } catch {
      return res.status(401).json({ error: "The passkey could not be verified.", code: "PASSKEY_INVALID" });
    }
    if (!verification.verified) {
      return res.status(401).json({ error: "The passkey could not be verified.", code: "PASSKEY_INVALID" });
    }
    const [[account]] = await db.query(`SELECT ${userColumns} FROM users WHERE id = ? AND is_active = 1`, [stored.user_id]);
    if (!account) return res.status(403).json({ error: "This account has been disabled." });

    await db.query("UPDATE user_passkeys SET counter = ?, last_used_at = NOW() WHERE id = ?", [verification.authenticationInfo.newCounter, stored.id]);
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [account.id]);
    noteSignIn(req, account);
    // A passkey with user verification is already two factors (the device
    // plus fingerprint/face/PIN), so the authenticator-code step is skipped.
    return res.json(buildAuthResponse(account, Boolean(challenge.rememberMe)));
  } catch (error) {
    return next(error);
  }
};

module.exports = { registrationOptions, registrationVerify, list, remove, loginOptions, makeLoginVerify, relyingParty };
