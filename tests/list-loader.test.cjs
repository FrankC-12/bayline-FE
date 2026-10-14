const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Exercise the real hook with controlled effect lifecycles and fetch timing.
function harness() {
  const slots = [];
  let cursor = 0, effects = [], quiet, updates = 0;
  const equal = (a, b) => a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const memo = (factory, deps) => {
    const i = cursor++;
    if (!slots[i] || !equal(slots[i].deps, deps)) slots[i] = { deps, value: factory() };
    return slots[i].value;
  };
  const react = {
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useState: (initial) => {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: initial };
      return [slots[i].value, (update) => {
        updates++;
        slots[i].value = typeof update === "function" ? update(slots[i].value) : update;
      }];
    },
    useEffect: (callback, deps) => {
      const i = cursor++;
      if (!slots[i] || !equal(slots[i].deps, deps)) {
        const old = slots[i];
        slots[i] = { deps, callback, effect: true };
        effects.push(() => { old?.cleanup?.(); slots[i].cleanup = callback(); });
      }
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/hooks/useListLoader.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function("require", "module", "exports", code)((name) => {
    if (name === "react") return react;
    if (name === "./useAutoRefresh") return { useAutoRefresh: (refresh) => { quiet = refresh; } };
    if (name === "@/lib/api/listError") return { classifyListError: (error) => ({ message: error.message }) };
    throw new Error(name);
  }, mod, mod.exports);
  return {
    render(fetcher, deps) {
      cursor = 0;
      const result = mod.exports.useListLoader(fetcher, deps, 15000);
      const pending = effects; effects = [];
      pending.forEach((effect) => effect());
      return result;
    },
    quiet: () => quiet(),
    unmount: () => slots.filter((slot) => slot?.effect).forEach((slot) => slot.cleanup?.()),
    replayEffects: () => slots.filter((slot) => slot?.effect).forEach((slot) => { slot.cleanup?.(); slot.cleanup = slot.callback(); }),
    updates: () => updates,
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("a slower initial response cannot overwrite a newer refresh", async () => {
  const h = harness(), first = deferred(), second = deferred();
  let calls = 0;
  const fetcher = () => (++calls === 1 ? first.promise : second.promise);
  const view = h.render(fetcher, ["a"]);
  const refresh = view.refresh();
  second.resolve(["new"]); await refresh;
  first.resolve(["old"]); await flush();
  assert.deepEqual(h.render(fetcher, ["a"]).data, ["new"]);
  assert.equal(h.render(fetcher, ["a"]).loading, false);
});

test("changing filial clears old data and ignores its outstanding requests", async () => {
  const h = harness(), old = deferred(), current = deferred();
  let calls = 0;
  const fetchA = () => ++calls === 1 ? Promise.resolve(["filial-a"]) : old.promise;
  const fetchB = () => current.promise;
  h.render(fetchA, ["a"]); await flush();
  const previous = h.render(fetchA, ["a"]).refresh();
  const b = h.render(fetchB, ["b"]);
  assert.deepEqual(b.data, []);
  assert.equal(b.loading, true);
  current.resolve(["filial-b"]); await flush();
  old.resolve(["obsolete-a"]); await previous;
  assert.deepEqual(h.render(fetchB, ["b"]).data, ["filial-b"]);
});

test("background refresh preserves data on failure and skips foreground loading", async () => {
  const h = harness(), request = deferred();
  let fail = false, calls = 0;
  const fetcher = () => { calls++; return fail ? Promise.reject(new Error("offline")) : request.promise; };
  h.render(fetcher, ["a"]);
  await h.quiet(); assert.equal(calls, 1);
  request.resolve(["saved"]); await flush();
  fail = true; await h.quiet();
  const view = h.render(fetcher, ["a"]);
  assert.deepEqual(view.data, ["saved"]);
  assert.equal(view.error, null);
  await view.refresh();
  assert.equal(h.render(fetcher, ["a"]).error.message, "offline");
  assert.equal(h.render(fetcher, ["a"]).loading, false);
});

test("unmount ignores late results and Strict Mode replay can load again", async () => {
  const h = harness(), first = deferred(), second = deferred();
  let calls = 0;
  const fetcher = () => ++calls === 1 ? first.promise : second.promise;
  h.render(fetcher, []); h.replayEffects();
  first.resolve(["discard"]); second.resolve(["current"]); await flush();
  assert.deepEqual(h.render(fetcher, []).data, ["current"]);
  const pending = h.render(fetcher, []).refresh();
  h.unmount(); const count = h.updates(); await pending;
  assert.equal(h.updates(), count);
});
