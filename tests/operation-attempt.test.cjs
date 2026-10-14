const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const mod = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/operation-attempt.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
new Function("require", "module", "exports", code)(() => ({ createRequestId: () => "unused" }), mod, mod.exports);
const { createOperationAttempt } = mod.exports;

test("retrying unchanged data after a lost response retains the operation ID", () => {
  let generated = 0;
  const attempt = createOperationAttempt(() => String(++generated));
  const first = attempt.idFor({ saleId: "vr-1", paid_usd: "50", account: "cash" });
  assert.equal(attempt.idFor({ saleId: "vr-1", paid_usd: "50", account: "cash" }), first);
  assert.equal(generated, 1);
});

test("editing amount, account or resource starts a new operation", () => {
  let generated = 0;
  const attempt = createOperationAttempt(() => String(++generated));
  const ids = [
    attempt.idFor({ saleId: "vr-1", paid_usd: "50", account: "cash" }),
    attempt.idFor({ saleId: "vr-1", paid_usd: "20", account: "cash" }),
    attempt.idFor({ saleId: "vr-1", paid_usd: "20", account: "bank" }),
    attempt.idFor({ saleId: "vr-2", paid_usd: "20", account: "bank" }),
  ];
  assert.equal(new Set(ids).size, 4);
});

test("after success, an identical intentional movement gets a new ID", () => {
  let generated = 0;
  const attempt = createOperationAttempt(() => String(++generated));
  const payload = { part_id: "part", quantity: 3 };
  const first = attempt.idFor(payload);
  attempt.reset();
  assert.notEqual(attempt.idFor(payload), first);
});
