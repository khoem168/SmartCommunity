const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

test("admin script and stylesheet URLs resolve to real files at their public paths", () => {
  // Run npm --prefix frontend_admin run build before this artifact check.
  const output = path.resolve(__dirname, "../frontend_admin/dist");
  const html = fs.readFileSync(path.join(output, "admin-console/index.html"), "utf8");
  const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
  assert.ok(assets.some((url) => url.endsWith(".js")), "Admin must load JavaScript");
  for (const url of assets) {
    assert.ok(url.startsWith("/admin-console/assets/"), url);
    assert.ok(fs.statSync(path.join(output, url.slice(1))).isFile(), url);
  }
});
