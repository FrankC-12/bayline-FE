const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function harness() {
  const states = [];
  let cursor = 0, fetch, response;
  const react = { useState(initial) {
    const index = cursor++;
    if (states[index] === undefined) states[index] = initial;
    return [states[index], (value) => { states[index] = value; }];
  } };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/hooks/usePagedList.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (name === "react") return react;
    if (name === "./useListLoader") return { useListLoader: (fetcher) => {
      fetch = fetcher;
      return { data: response ? [response] : [], loading: false, error: null, refresh: fetcher };
    } };
    throw new Error(name);
  }, mod, mod.exports);
  return {
    render(scope) {
      cursor = 0;
      return mod.exports.usePagedList(async (page, size) => ({page, page_size: size, total: 500, total_pages: 17, items: []}), scope);
    },
    fetch: () => fetch(),
    response: (value) => { response = value; },
  };
}

test("paging is retained until filters, user scope or page size change", async () => {
  const h = harness();
  let view = h.render("user-a:filial-a:search-one");
  view.setPage(4);
  view = h.render("user-a:filial-a:search-one");
  assert.equal((await h.fetch())[0].page, 4);
  view = h.render("user-a:filial-a:search-two");
  assert.equal(view.page, 1);
  view.setPage(3); view = h.render("user-a:filial-a:search-two");
  assert.equal(view.page, 3);
  view.setPageSize(60); view = h.render("user-a:filial-a:search-two");
  assert.equal(view.page, 1);
  assert.equal((await h.fetch())[0].page_size, 60);
  view.setPage(5); view = h.render("user-b:filial-a:search-two");
  assert.equal(view.page, 1);
});

test("navigation uses the server's last valid page after totals shrink", () => {
  const h = harness();
  let view = h.render("same"); view.setPage(10);
  h.response({page: 2, page_size: 30, total: 40, total_pages: 2, items: [{id: "record"}]});
  view = h.render("same");
  assert.equal(view.page, 2);
  assert.equal(view.totalPages, 2);
  assert.equal(view.total, 40);
  assert.deepEqual(view.items, [{id: "record"}]);
});
