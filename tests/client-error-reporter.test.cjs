const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function harness(user = { id: "private-user-id" }) {
  const listeners = {}, sent = [], navigator = { onLine: true };
  let cleanup;
  const window = {
    location: { pathname: "/dashboard/almacen/private-customer" },
    addEventListener: (name, callback) => { listeners[name] = callback; },
    removeEventListener: (name) => { delete listeners[name]; },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/components/ClientErrorReporter.tsx"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", "window", "navigator", "fetch", code)((name) => {
    if (name === "react") return { useEffect: (callback) => { cleanup = callback(); } };
    if (name === "@/contexts/AuthContext") return { useAuth: () => ({ currentUser: user }) };
    throw new Error(name);
  }, mod, mod.exports, window, navigator, (url, options) => { sent.push({ url, ...options }); return Promise.resolve(); });
  mod.exports.default();
  return { listeners, sent, navigator, cleanup: () => cleanup?.() };
}

test("frontend reports only classified metadata and bounds repeated errors", async () => {
  const h = harness();
  for (let i = 0; i < 8; i++) h.listeners.unhandledrejection({ reason: new TypeError("private-secret-message") });
  assert.equal(h.sent.length, 5);
  assert.deepEqual(JSON.parse(h.sent[0].body), { platform: "web", kind: "unhandled_rejection", error_type: "TypeError", area: "inventory" });
  assert.equal(h.sent[0].credentials, "include");
  assert.equal(h.sent[0].headers["X-CSRF-Protection"], "1");
  assert.doesNotMatch(h.sent[0].body, /private|secret/);
  h.cleanup();
  assert.deepEqual(Object.keys(h.listeners), []);
  await new Promise((resolve) => setImmediate(resolve));
});

test("no telemetry is sent without a session or while offline", () => {
  const anonymous = harness(null);
  assert.deepEqual(Object.keys(anonymous.listeners), []);
  const offline = harness(); offline.navigator.onLine = false;
  offline.listeners.error({ error: new Error("private") });
  assert.equal(offline.sent.length, 0);
  offline.cleanup();
});
