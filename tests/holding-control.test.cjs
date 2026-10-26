const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTS } = require("./helpers/load-ts.cjs");
const { renderCell } = loadTS("src/lib/holdingControlFormat.ts");
test("holding money keeps currencies separate and uses Venezuelan separators", () => {
  assert.equal(renderCell(12500.7, "money", "usd"), "$ 12.500,70");
  assert.equal(renderCell(12500.7, "money", "bs"), "Bs. 12.500,70");
  assert.equal(renderCell(0, "money", "usd"), "$ 0,00");
  assert.equal(renderCell(null, "money", "usd"), "—");
});
test("holding stock lifecycle is displayed in Spanish", () => {
  assert.equal(renderCell("requested", "status"), "Solicitada");
  assert.equal(renderCell("received", "status"), "Recibida");
  assert.equal(renderCell("control_calidad", "status"), "Control de calidad");
});
