const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const mod = { exports: {} };
new Function("require", "module", "exports", ts.transpileModule(fs.readFileSync("src/lib/format.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, mod, mod.exports);
test("warranty and claim dates preserve the calendar day", () => {
  for (const zone of ["America/Caracas", "UTC", "Pacific/Kiritimati"]) {
    const previous = process.env.TZ;
    try {
      process.env.TZ = zone;
      assert.equal(mod.exports.formatEntryDate("2026-10-07"), "7/10/2026");
      assert.equal(mod.exports.formatEntryDate("2027-01-04"), "4/1/2027");
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  }
});
