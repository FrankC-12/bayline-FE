const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function client() {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/api/client.ts"), "utf8"), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText;
  const mod = {exports: {}};
  new Function("module", "exports", code)(mod, mod.exports);
  return mod.exports;
}
test("PDF download preserves bytes, cookies and CSRF headers", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/v1/service-orders/123/invoice/pdf");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.get("X-CSRF-Protection"), "1");
    return new Response("%PDF-1.7\nexample", {headers: {"Content-Type": "application/pdf"}});
  });
  const blob = await client().apiFetchBlob("/service-orders/123/invoice/pdf");
  assert.equal(blob.type, "application/pdf");
  assert.equal(await blob.text(), "%PDF-1.7\nexample");
});
test("PDF download renews expired session before retrying", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    if (calls.length === 1) return new Response("", {status: 401});
    if (url.endsWith("/auth/refresh")) return new Response("{}");
    return new Response("%PDF-1.7");
  });
  assert.equal(await (await client().apiFetchBlob("/document.pdf")).text(), "%PDF-1.7");
  assert.deepEqual(calls, ["/api/v1/document.pdf", "/api/v1/auth/refresh", "/api/v1/document.pdf"]);
});
test("PDF errors stay API errors; existing JSON requests still parse correctly", async (t) => {
  const api = client();
  t.mock.method(globalThis, "fetch", async (url) => url.endsWith(".pdf")
    ? new Response(JSON.stringify({statusCode: 403, errorCode: "forbidden", message: "Sin permiso"}), {status: 403})
    : new Response(JSON.stringify({ok: true})));
  await assert.rejects(api.apiFetchBlob("/document.pdf"), (err) => err instanceof api.ApiError && err.statusCode === 403 && err.message === "Sin permiso");
  assert.deepEqual(await api.apiFetch("/document"), {ok: true});
});

test("unexpected API errors expose a support reference without changing validation messages", () => {
  const {ApiError} = client();
  const unexpected = new ApiError({statusCode: 500, errorCode: "internal_error", message: "Ocurrió un error", requestId: "server-reference"});
  assert.equal(unexpected.requestId, "server-reference");
  assert.equal(unexpected.message, "Ocurrió un error Referencia: server-reference");
  const validation = new ApiError({statusCode: 422, errorCode: "validation_error", message: "Monto inválido", requestId: "other-reference", details: [{field: "amount", message: "Debe ser mayor a cero"}]});
  assert.equal(validation.message, "Monto inválido");
  assert.equal(validation.fieldErrors[0].field, "amount");
});
