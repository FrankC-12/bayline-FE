const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTS } = require("./helpers/load-ts.cjs");
const mod = { exports: loadTS("src/lib/format.ts") };
test("warranty and claim dates preserve the calendar day", () => {
  for (const zone of ["America/Caracas", "UTC", "Pacific/Kiritimati"]) {
    const previous = process.env.TZ;
    try {
      process.env.TZ = zone;
      assert.equal(mod.exports.formatEntryDate("2026-10-07"), "7/10/2026");
      assert.equal(mod.exports.formatEntryDate("2027-01-04"), "4/1/2027");
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  }
});
