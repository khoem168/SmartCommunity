const assert = require("assert");
const { isEmailVerificationRequired } = require("../config/authFeatures");

const original = process.env.REQUIRE_EMAIL_VERIFICATION;

try {
  delete process.env.REQUIRE_EMAIL_VERIFICATION;
  assert.equal(isEmailVerificationRequired(), true);

  for (const value of ["false", "FALSE", "0", "no", "off"]) {
    process.env.REQUIRE_EMAIL_VERIFICATION = value;
    assert.equal(isEmailVerificationRequired(), false, `${value} should disable it`);
  }

  for (const value of ["true", "1", "yes", "on", "unexpected"]) {
    process.env.REQUIRE_EMAIL_VERIFICATION = value;
    assert.equal(isEmailVerificationRequired(), true, `${value} should keep it enabled`);
  }

  console.log("Authentication feature configuration test passed.");
} finally {
  if (original === undefined) delete process.env.REQUIRE_EMAIL_VERIFICATION;
  else process.env.REQUIRE_EMAIL_VERIFICATION = original;
}
