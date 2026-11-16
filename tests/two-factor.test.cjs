const assert = require("node:assert/strict");
const { test } = require("node:test");
const totp = require("../backend/src/utils/totp");

// RFC 6238 appendix B: ASCII secret "12345678901234567890", SHA-1. The
// 8-digit reference codes end in these 6 digits.
const RFC_SECRET = totp.base32Encode(Buffer.from("12345678901234567890"));
const RFC_VECTORS = [
  [59, "287082"],
  [1111111109, "081804"],
  [1111111111, "050471"],
  [1234567890, "005924"],
  [2000000000, "279037"],
];

test("codes match the RFC 6238 reference values used by authenticator apps", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  for (const [seconds, expected] of RFC_VECTORS) {
    assert.equal(totp.codeForStep(RFC_SECRET, Math.floor(seconds / 30)), expected, `t=${seconds}`);
  }
  assert.deepEqual(totp.base32Decode(RFC_SECRET), Buffer.from("12345678901234567890"));
});

test("a code is accepted one step either side, and never twice", () => {
  const secret = totp.generateSecret();
  const now = 1_800_000_000_000;
  const step = totp.currentStep(now);
  assert.equal(totp.verifyCode(secret, totp.codeForStep(secret, step), { now }), step);
  assert.equal(totp.verifyCode(secret, totp.codeForStep(secret, step - 1), { now }), step - 1);
  assert.equal(totp.verifyCode(secret, totp.codeForStep(secret, step + 1), { now }), step + 1);
  assert.equal(totp.verifyCode(secret, totp.codeForStep(secret, step - 2), { now }), null);
  // Replay: the same (or an older) step is rejected once it has been used.
  assert.equal(totp.verifyCode(secret, totp.codeForStep(secret, step), { now, lastUsedStep: step }), null);
  assert.equal(totp.verifyCode(secret, "12345", { now }), null);
  assert.equal(totp.verifyCode(secret, "abcdef", { now }), null);
});

test("secrets are encrypted at rest and tampering is detected", () => {
  const secret = totp.generateSecret();
  const stored = totp.encryptSecret(secret);
  assert.notEqual(stored, secret);
  assert.doesNotMatch(stored, new RegExp(secret));
  assert.equal(totp.decryptSecret(stored), secret);
  const parts = stored.split(".");
  parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith("A") ? "BB" : "AA");
  assert.throws(() => totp.decryptSecret(parts.join(".")));
});

test("recovery codes are unique and compare without dashes or case", () => {
  const codes = totp.generateRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  assert.match(codes[0], /^[0-9a-f]{5}-[0-9a-f]{5}$/);
  assert.equal(
    totp.hashToken(totp.normaliseRecoveryCode(codes[0].toUpperCase().replace("-", " "))),
    totp.hashToken(totp.normaliseRecoveryCode(codes[0])),
  );
});

test("the setup link carries the secret and account for the QR code", () => {
  const url = new URL(totp.otpauthUrl({ secret: "ABCDEF", account: "a@b.com" }));
  assert.equal(url.protocol, "otpauth:");
  assert.equal(url.host, "totp");
  assert.equal(decodeURIComponent(url.pathname), "/Smart Community:a@b.com");
  assert.equal(url.searchParams.get("secret"), "ABCDEF");
  assert.equal(url.searchParams.get("issuer"), "Smart Community");
});
