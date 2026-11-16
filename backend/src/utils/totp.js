// Time-based one-time passwords (RFC 6238, the 6-digit codes shown by
// Google Authenticator, Microsoft Authenticator, Authy and similar apps),
// plus encryption for the stored secrets. Uses only Node's crypto module.
const crypto = require("crypto");

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
};

const base32Decode = (text) => {
  const clean = String(text).toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

const generateSecret = () => base32Encode(crypto.randomBytes(20));

const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

const codeForStep = (secret, step) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
};

/**
 * Returns the matching time step, or null. Accepts one step either side for
 * phone clocks that drift, and rejects any step at or before `lastUsedStep`
 * so an intercepted code cannot be replayed.
 */
const verifyCode = (secret, code, { lastUsedStep = null, now = Date.now() } = {}) => {
  const clean = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const step = currentStep(now);
  for (const candidate of [step, step - 1, step + 1]) {
    if (lastUsedStep !== null && candidate <= Number(lastUsedStep)) continue;
    const expected = codeForStep(secret, candidate);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return candidate;
  }
  return null;
};

const otpauthUrl = ({ secret, account, issuer = "Smart Community" }) => {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: "SHA1", digits: String(DIGITS), period: String(STEP_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
};

// Secrets are stored encrypted (AES-256-GCM). The key comes from
// TWO_FACTOR_ENCRYPTION_KEY, falling back to JWT_SECRET; changing whichever
// one is used makes existing secrets unreadable (an admin can reset 2FA).
const encryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(
      `smart-community-2fa:${
        process.env.TWO_FACTOR_ENCRYPTION_KEY ||
        process.env.JWT_SECRET ||
        "local-development-secret-change-before-hosting"
      }`,
    )
    .digest();

const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
};

const decryptSecret = (stored) => {
  const [version, iv, tag, data] = String(stored || "").split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unreadable two-factor secret.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
};

// Recovery codes and trusted-device tokens are stored only as hashes.
const hashToken = (value) =>
  crypto.createHmac("sha256", encryptionKey()).update(String(value)).digest("hex");

const normaliseRecoveryCode = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const generateRecoveryCodes = (count = 10) =>
  Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(5).toString("hex"); // 10 hex characters
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });

module.exports = {
  base32Encode,
  base32Decode,
  generateSecret,
  currentStep,
  codeForStep,
  verifyCode,
  otpauthUrl,
  encryptSecret,
  decryptSecret,
  hashToken,
  normaliseRecoveryCode,
  generateRecoveryCodes,
};
