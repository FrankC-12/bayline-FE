const { test } = require("node:test");
const assert = require("node:assert/strict");
const { loadTS } = require("./helpers/load-ts.cjs");
const api = loadTS("src/lib/api/serviceOrders.ts");
test("active and draft tabs request separate queues while calendar retains all drafts", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(new URL(url, "http://test"));
    return new Response("[]", {
      headers: { "Content-Type": "application/json" },
    });
  });
  await api.listServiceOrders("filial", "active");
  await api.listServiceOrders("filial", "drafts");
  await api.listServiceOrders("filial", "all");
  assert.equal(calls[0].searchParams.get("include_drafts"), "false");
  assert.equal(calls[1].searchParams.get("view"), "drafts");
  assert.equal(calls[2].searchParams.get("include_drafts"), "true");
  await api.listServiceOrderPage("filial", 1, 30, {
    view: "drafts",
    search: "ODS-20",
  });
  assert.equal(calls[3].searchParams.get("view"), "drafts");
  assert.equal(calls[3].searchParams.get("search"), "ODS-20");
});
test("cancellation records a reason and deletion uses the protected draft endpoint", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return options.method === "DELETE"
      ? new Response(null, { status: 204 })
      : new Response("{}", { headers: { "Content-Type": "application/json" } });
  });
  await api.cancelServiceOrder("draft-id", "El cliente no continuará");
  await api.discardOrderDraft("draft-id");
  assert.equal(calls[0].url, "/api/v1/service-orders/draft-id/cancel");
  assert.equal(
    JSON.parse(calls[0].options.body).reason,
    "El cliente no continuará",
  );
  assert.equal(calls[1].url, "/api/v1/service-order-drafts/draft-id");
  assert.equal(calls[1].options.method, "DELETE");
});
