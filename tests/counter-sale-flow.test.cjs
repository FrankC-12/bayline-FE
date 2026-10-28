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
      path.join(__dirname, "../src/lib/counter-sale-flow.ts"),
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
const { counterSaleLabel, counterSaleActions } = mod.exports;
test("salesperson waits for warehouse and can only receive after dispatch", () => {
  const waiting = { status: "pendiente", dispatched_at: null };
  assert.equal(counterSaleLabel(waiting), "Esperando despacho de almacén");
  assert.deepEqual(counterSaleActions(waiting, false, false, true), {
    dispatch: false,
    receive: false,
  });
  assert.deepEqual(
    counterSaleActions(
      { status: "pedido", dispatched_at: "2026-10-28" },
      false,
      false,
      true,
    ),
    { dispatch: false, receive: true },
  );
});
test("warehouse dispatches but cannot acknowledge receipt at the counter", () => {
  assert.deepEqual(
    counterSaleActions({ status: "pendiente" }, true, true, false),
    { dispatch: true, receive: false },
  );
  assert.deepEqual(
    counterSaleActions(
      { status: "pedido", dispatched_at: "2026-10-28" },
      true,
      true,
      false,
    ),
    { dispatch: false, receive: false },
  );
  assert.deepEqual(
    counterSaleActions({ status: "pendiente" }, true, false, false),
    { dispatch: false, receive: false },
  );
});
test("historical pedido must be confirmed by warehouse before receipt", () => {
  const legacy = { status: "pedido", dispatched_at: null };
  assert.equal(counterSaleLabel(legacy), "Esperando despacho de almacén");
  assert.equal(counterSaleActions(legacy, false, false, true).receive, false);
  assert.equal(counterSaleActions(legacy, true, true, false).dispatch, true);
});
test("terminal sales expose no dispatch or receipt actions even to an administrator", () => {
  for (const status of ["cancelado", "completado"])
    for (const warehouseView of [true, false])
      assert.deepEqual(
        counterSaleActions({ status }, warehouseView, true, true),
        { dispatch: false, receive: false },
      );
  assert.equal(
    counterSaleLabel({ status: "completado" }),
    "Recibido en mostrador",
  );
});
