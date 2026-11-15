const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");

test("invalid production configuration exposes names only and blocks every API", () => {
  const output = execFileSync(process.execPath, ["-e", `
    const assert = require('node:assert/strict');
    const { once } = require('node:events');
    const server = require('./backend/src/server');
    (async () => {
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const base = 'http://127.0.0.1:' + server.address().port;
      try {
        const health = await fetch(base + '/health');
        assert.equal(health.status, 503);
        assert.equal(health.headers.get('cache-control'), 'no-store');
        const body = await health.json();
        assert.deepEqual(body, {
          status: 'error', service: 'smart-community-api',
          code: 'INVALID_PRODUCTION_CONFIGURATION',
          configurationFields: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET', 'CLIENT_URL', 'APP_URL']
        });
        for (const route of ['/api/courses', '/api/auth/me', '/api/auth/register']) {
          const response = await fetch(base + route, route.endsWith('/register')
            ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
            : {});
          assert.equal(response.status, 503);
          const data = await response.json();
          assert.equal(data.code, 'SERVER_UNAVAILABLE');
          assert.equal(data.configurationFields, undefined);
          assert.equal(JSON.stringify(data).includes('private-fixture'), false);
        }
        console.log('startup checks passed');
      } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
      }
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      NODE_ENV: "production",
      DB_HOST: "", DB_USER: "", DB_PASSWORD: "", DB_NAME: "",
      JWT_SECRET: "private-fixture", CLIENT_URL: "", APP_URL: "",
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 15000,
  });
  assert.match(output, /startup checks passed/);
});
