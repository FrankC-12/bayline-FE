const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const {webcrypto} = require("node:crypto");
const mod = {exports: {}};
new Function("module", "exports", ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/request-id.ts"), "utf8"), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText)(mod, mod.exports);
const {createRequestId} = mod.exports;

test("uses native UUID when available", (t) => {
  t.mock.getter(globalThis, "crypto", () => ({randomUUID: () => "native-uuid"}));
  assert.equal(createRequestId(), "native-uuid");
});
test("HTTP browser without randomUUID creates valid unique UUID v4 values", (t) => {
  t.mock.getter(globalThis, "crypto", () => ({getRandomValues: webcrypto.getRandomValues.bind(webcrypto)}));
  const ids = Array.from({length: 100}, createRequestId);
  assert.equal(new Set(ids).size, 100);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
test("missing crypto produces a readable error handled by the invoice form", (t) => {
  t.mock.getter(globalThis, "crypto", () => undefined);
  assert.throws(createRequestId, /No se pudo generar el identificador/);
});
