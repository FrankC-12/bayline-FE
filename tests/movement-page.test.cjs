const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function api() {
  const requests = [];
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/api/warehouse.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (name === "./client") return { apiFetch: async (url) => { requests.push(url); return { items: [], total: 0, page: 1, page_size: 50, total_pages: 1 }; } };
    throw new Error(name);
  }, mod, mod.exports);
  return { ...mod.exports, requests };
}

test("movement pages send search and dates as safe query parameters", async () => {
  const client = api();
  await client.listMovementPage("filial", { page: 2, page_size: 20, warehouse_id: "warehouse",
    search: "Filtro 100% & aceite", movement_type: "transferencia", date_from: "2026-10-13", date_to: "2026-10-14" });
  const url = new URL(client.requests[0], "http://test");
  assert.equal(url.pathname, "/almacen/movements/page");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("search"), "Filtro 100% & aceite");
  assert.equal(url.searchParams.get("date_to"), "2026-10-14");
  assert.equal(url.searchParams.get("movement_type"), "transferencia");
  assert.equal(url.searchParams.get("warehouse_id"), "warehouse");
});

test("empty filters are omitted and the legacy API remains available", async () => {
  const client = api();
  await client.listMovementPage("filial", { page: 1, page_size: 50, search: "", warehouse_id: undefined });
  const params = new URL(client.requests[0], "http://test").searchParams;
  assert.equal(params.has("warehouse_id"), false);
  assert.equal(params.has("search"), false);
  await client.listMovements("filial");
  assert.equal(client.requests[1], "/almacen/movements?filial_id=filial");
});
