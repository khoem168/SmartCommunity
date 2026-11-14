const assert = require("node:assert/strict");
const { after, test } = require("node:test");

const originalFetch = global.fetch;
const originalWindow = global.window;
global.window = {
  sessionStorage: { getItem: () => null },
  localStorage: { getItem: () => null },
};
after(() => {
  global.fetch = originalFetch;
  if (originalWindow === undefined) delete global.window;
  else global.window = originalWindow;
});

for (const frontend of ["frontend_user", "frontend_admin"]) {
  test(`${frontend}: distinguish unavailable API, routing errors and validation errors`, async (t) => {
    const { apiFetch } = await import(`../${frontend}/src/services/api.js`);

    await t.test("Vercel plain-text 500 produces a useful error", async () => {
      global.fetch = async () => new Response("FUNCTION_INVOCATION_FAILED", { status: 500 });
      await assert.rejects(apiFetch("/auth/register"), {
        code: "SERVER_UNAVAILABLE",
        message: "The server is temporarily unavailable. Please try again later.",
      });
    });

    await t.test("HTML from an SPA fallback is never treated as API success", async () => {
      global.fetch = async () => new Response("<!doctype html><html></html>", {
        headers: { "Content-Type": "text/html" },
      });
      await assert.rejects(apiFetch("/courses"), { code: "INVALID_API_RESPONSE" });
    });

    await t.test("preserve server validation errors", async () => {
      global.fetch = async () => Response.json({ error: "Email is already registered.", code: "EMAIL_EXISTS" }, { status: 409 });
      await assert.rejects(apiFetch("/auth/register"), { message: "Email is already registered.", code: "EMAIL_EXISTS" });
    });

    await t.test("return valid JSON and accept empty 204 responses", async () => {
      global.fetch = async () => Response.json({ courses: [] });
      assert.deepEqual(await apiFetch("/courses"), { courses: [] });
      global.fetch = async () => new Response(null, { status: 204 });
      assert.equal(await apiFetch("/notifications/1", { method: "DELETE" }), null);
    });
  });
}
