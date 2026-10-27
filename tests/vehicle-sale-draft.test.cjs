const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const mod = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/lib/vehicle-sale-draft.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
)(mod, mod.exports);
const { readVehicleSaleDraft, vehicleSaleDraftKey } = mod.exports;
const draft = {
  version: 1,
  savedAt: 1000,
  clientId: "client",
  advisorId: "advisor",
  saleType: "contado",
  paymentMethod: "mixed",
  usdBaseInput: "1000.50",
  usdChannel: "zelle",
  bsChannel: "transferencia",
  belowCostNote: "",
};
function storage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}
test("sale draft restores selection without keeping a stale quote and is scoped to user, branch and vehicle", () => {
  const store = storage();
  const key = vehicleSaleDraftKey("user", "branch", "vehicle");
  store.setItem(key, JSON.stringify(draft));
  assert.deepEqual(readVehicleSaleDraft(store, key, 1001), draft);
  for (const other of [
    vehicleSaleDraftKey("other", "branch", "vehicle"),
    vehicleSaleDraftKey("user", "other", "vehicle"),
    vehicleSaleDraftKey("user", "branch", "other"),
  ])
    assert.equal(readVehicleSaleDraft(store, other, 1001), null);
  assert.equal("price" in readVehicleSaleDraft(store, key, 1001), false);
});
test("expired, future and malformed drafts are discarded", () => {
  const store = storage();
  const key = "draft";
  for (const value of [
    { ...draft, savedAt: 0 },
    { ...draft, savedAt: 90000000 },
    { ...draft, advisorId: {} },
    { ...draft, paymentMethod: "other" },
    { ...draft, usdChannel: "unknown" },
  ]) {
    store.setItem(key, JSON.stringify(value));
    assert.equal(readVehicleSaleDraft(store, key, 86400000), null);
    assert.equal(store.getItem(key), null);
  }
  store.setItem(key, "broken");
  assert.equal(readVehicleSaleDraft(store, key), null);
});
test("blocked browser storage does not prevent using the sale form", () => {
  assert.equal(readVehicleSaleDraft(null, "key"), null);
  assert.equal(
    readVehicleSaleDraft(
      {
        getItem() {
          throw new Error("blocked");
        },
        removeItem() {
          throw new Error("blocked");
        },
      },
      "key",
    ),
    null,
  );
});
