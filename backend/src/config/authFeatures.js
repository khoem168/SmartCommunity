const disabledValues = new Set(["0", "false", "no", "off"]);

const isEmailVerificationRequired = () =>
  !disabledValues.has(
    String(process.env.REQUIRE_EMAIL_VERIFICATION ?? "true")
      .trim()
      .toLowerCase(),
  );

module.exports = { isEmailVerificationRequired };
