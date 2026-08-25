const assert = require("assert");

const run = async () => {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    APP_URL: process.env.APP_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };
  const requests = [];

  process.env.APP_URL = "https://smart-community.example";
  process.env.EMAIL_FROM = "Smart Community <verify@example.com>";
  process.env.RESEND_API_KEY = "re_test_only";
  global.fetch = async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: `email-${requests.length}` }),
    };
  };

  const modulePath = require.resolve("../services/emailService");
  delete require.cache[modulePath];
  const { sendPasswordResetEmail, sendVerificationEmail } = require(modulePath);

  try {
    const verification = await sendVerificationEmail({
      email: "learner@example.com",
      fullName: "Learner <script>alert(1)</script>",
      token: "verify token",
    });
    const reset = await sendPasswordResetEmail({
      email: "learner@example.com",
      fullName: "Learner",
      token: "reset token",
    });

    assert.equal(verification.delivered, true);
    assert.equal(verification.provider, "resend");
    assert.equal(reset.delivered, true);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, "https://api.resend.com/emails");
    assert.equal(requests[0].options.headers.Authorization, "Bearer re_test_only");
    assert.deepEqual(requests[0].body.to, ["learner@example.com"]);
    assert.equal(requests[0].body.from, "Smart Community <verify@example.com>");
    assert.match(requests[0].body.html, /Learner &lt;script&gt;/);
    assert.doesNotMatch(requests[0].body.html, /<script>/);
    assert.equal(
      verification.url,
      "https://smart-community.example/verify-email?token=verify%20token",
    );
    assert.equal(
      reset.url,
      "https://smart-community.example/reset-password?token=reset%20token",
    );

    console.log("Email delivery test passed.");
  } finally {
    global.fetch = originalFetch;
    Object.entries(originalEnvironment).forEach(([name, value]) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
    delete require.cache[modulePath];
  }
};

run().catch((error) => {
  console.error("Email delivery test failed:", error.message);
  process.exit(1);
});
