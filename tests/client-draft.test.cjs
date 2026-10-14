const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const mod = { exports: {} };
new Function("module", "exports", ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/client-draft.ts"), "utf8"), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText)(mod, mod.exports);
const {draftKey, initialClientDraft, writeClientDraft, readClientDraft, clearClientDrafts, resumeClientDrafts} = mod.exports;
function storage() {
  const values = new Map();
  return { get length() {return values.size;}, key: (i) => [...values.keys()][i] ?? null,
    getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test("drafts survive reopening and are isolated by user, filial and client", () => {
  const store = storage(), key = draftKey("u1", "f1", "c1");
  const data = {...initialClientDraft(null), fullName: "José", phonePrimary: "04121234567"};
  assert.equal(writeClientDraft(store, key, data, "original-version"), true);
  assert.deepEqual(readClientDraft(store, key).data, data);
  assert.equal(readClientDraft(store, key).baseVersion, "original-version");
  for (const other of [draftKey("u2", "f1", "c1"), draftKey("u1", "f2", "c1"), draftKey("u1", "f1", "c2")]) assert.equal(readClientDraft(store, other), null);
});

test("expired or malformed drafts are not restored", () => {
  const store = storage(), key = draftKey("u", "f");
  store.setItem(key, JSON.stringify({version: 1, savedAt: 1, baseVersion: null, data: initialClientDraft(null)}));
  assert.equal(readClientDraft(store, key, 86400001), null);
  store.setItem(key, "not-json"); assert.equal(readClientDraft(store, key), null);
  store.setItem(key, JSON.stringify({version: 1, savedAt: Date.now(), baseVersion: null, data: {fullName: 4}}));
  assert.equal(readClientDraft(store, key), null);
});

test("storage errors do not crash a form or pretend a draft was saved", () => {
  const blocked = {getItem() {throw new Error("blocked");}, setItem() {throw new Error("quota");}};
  assert.equal(readClientDraft(blocked, "key"), null);
  assert.equal(writeClientDraft(blocked, "key", initialClientDraft(null), null), false);
  assert.equal(writeClientDraft(null, "key", initialClientDraft(null), null), false);
});

test("logout clears drafts and prevents unmount cleanup from restoring them", () => {
  const store = storage(), key = draftKey("u", "f");
  store.setItem("unrelated-setting", "keep");
  writeClientDraft(store, key, initialClientDraft(null), null);
  clearClientDrafts(store);
  assert.equal(readClientDraft(store, key), null);
  assert.equal(writeClientDraft(store, key, initialClientDraft(null), null), false);
  assert.equal(store.getItem("unrelated-setting"), "keep");
  resumeClientDrafts(store);
  assert.equal(writeClientDraft(store, key, initialClientDraft(null), null), true);
});
