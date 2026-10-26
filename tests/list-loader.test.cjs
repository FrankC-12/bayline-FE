const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

// Exercise the real hook with controlled effect lifecycles and fetch timing.
function harness(summaryApi, warehouseApi) {
  const slots = [];
  let cursor = 0,
    effects = [],
    quiet,
    updates = 0;
  const equal = (a, b) =>
    a && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const memo = (factory, deps) => {
    const i = cursor++;
    if (!slots[i] || !equal(slots[i].deps, deps))
      slots[i] = { deps, value: factory() };
    return slots[i].value;
  };
  const react = {
    useRef: (initial) => memo(() => ({ current: initial }), []),
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useState: (initial) => {
      const i = cursor++;
      if (!slots[i]) slots[i] = { value: initial };
      return [
        slots[i].value,
        (update) => {
          updates++;
          slots[i].value =
            typeof update === "function" ? update(slots[i].value) : update;
        },
      ];
    },
    useEffect: (callback, deps) => {
      const i = cursor++;
      if (!slots[i] || !equal(slots[i].deps, deps)) {
        const old = slots[i];
        slots[i] = { deps, callback, effect: true };
        effects.push(() => {
          old?.cleanup?.();
          slots[i].cleanup = callback();
        });
      }
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/hooks/useListLoader.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "react") return react;
      if (name === "./useAutoRefresh")
        return {
          useAutoRefresh: (refresh) => {
            quiet = refresh;
          },
        };
      if (name === "@/lib/api/listError")
        return { classifyListError: (error) => ({ message: error.message }) };
      throw new Error(name);
    },
    mod,
    mod.exports,
  );
  let renderHook = (fetcher, deps) =>
    mod.exports.useListLoader(fetcher, deps, 15000);
  if (summaryApi) {
    const summaryModule = { exports: {} };
    const summaryCode = ts.transpileModule(
      fs.readFileSync(
        path.join(__dirname, "../src/hooks/useOrderSummary.ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText;
    new Function("require", "module", "exports", summaryCode)(
      (name) => {
        if (name === "react") return react;
        if (name === "./useListLoader") return mod.exports;
        if (name === "@/lib/api/serviceOrders") return summaryApi;
        throw new Error(name);
      },
      summaryModule,
      summaryModule.exports,
    );
    renderHook = (orderId) => summaryModule.exports.useOrderSummary(orderId);
  }
  if (warehouseApi) {
    const warehouseModule = { exports: {} };
    const source = ts.transpileModule(
      fs.readFileSync(
        path.join(__dirname, "../src/hooks/useServiceOrderPartRequests.ts"),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText;
    new Function("require", "module", "exports", source)(
      (name) => {
        if (name === "react") return react;
        if (name === "./useListLoader") return mod.exports;
        if (name === "@/lib/api/listError")
          return { classifyListError: (error) => ({ message: error.message }) };
        if (name === "@/lib/dispatchQueue")
          return require("./helpers/load-ts.cjs").loadTS(
            "src/lib/dispatchQueue.ts",
          );
        if (name === "@/lib/api/warehouse") return warehouseApi;
        throw new Error(name);
      },
      warehouseModule,
      warehouseModule.exports,
    );
    renderHook = (filial) =>
      warehouseModule.exports.useServiceOrderPartRequests(filial);
  }
  return {
    render(...args) {
      cursor = 0;
      const result = renderHook(...args);
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
      return result;
    },
    quiet: () => quiet(),
    unmount: () =>
      slots.filter((slot) => slot?.effect).forEach((slot) => slot.cleanup?.()),
    replayEffects: () =>
      slots
        .filter((slot) => slot?.effect)
        .forEach((slot) => {
          slot.cleanup?.();
          slot.cleanup = slot.callback();
        }),
    updates: () => updates,
  };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

test("a slower initial response cannot overwrite a newer refresh", async () => {
  const h = harness(),
    first = deferred(),
    second = deferred();
  let calls = 0;
  const fetcher = () => (++calls === 1 ? first.promise : second.promise);
  const view = h.render(fetcher, ["a"]);
  const refresh = view.refresh();
  second.resolve(["new"]);
  await refresh;
  first.resolve(["old"]);
  await flush();
  assert.deepEqual(h.render(fetcher, ["a"]).data, ["new"]);
  assert.equal(h.render(fetcher, ["a"]).loading, false);
});

test("changing filial clears old data and ignores its outstanding requests", async () => {
  const h = harness(),
    old = deferred(),
    current = deferred();
  let calls = 0;
  const fetchA = () =>
    ++calls === 1 ? Promise.resolve(["filial-a"]) : old.promise;
  const fetchB = () => current.promise;
  h.render(fetchA, ["a"]);
  await flush();
  const previous = h.render(fetchA, ["a"]).refresh();
  const b = h.render(fetchB, ["b"]);
  assert.deepEqual(b.data, []);
  assert.equal(b.loading, true);
  current.resolve(["filial-b"]);
  await flush();
  old.resolve(["obsolete-a"]);
  await previous;
  assert.deepEqual(h.render(fetchB, ["b"]).data, ["filial-b"]);
});

test("background refresh preserves data on failure and skips foreground loading", async () => {
  const h = harness(),
    request = deferred();
  let fail = false,
    calls = 0;
  const fetcher = () => {
    calls++;
    return fail ? Promise.reject(new Error("offline")) : request.promise;
  };
  h.render(fetcher, ["a"]);
  await h.quiet();
  assert.equal(calls, 1);
  request.resolve(["saved"]);
  await flush();
  fail = true;
  await h.quiet();
  const view = h.render(fetcher, ["a"]);
  assert.deepEqual(view.data, ["saved"]);
  assert.equal(view.error, null);
  await view.refresh();
  assert.equal(h.render(fetcher, ["a"]).error.message, "offline");
  assert.equal(h.render(fetcher, ["a"]).loading, false);
});

test("unmount ignores late results and Strict Mode replay can load again", async () => {
  const h = harness(),
    first = deferred(),
    second = deferred();
  let calls = 0;
  const fetcher = () => (++calls === 1 ? first.promise : second.promise);
  h.render(fetcher, []);
  h.replayEffects();
  first.resolve(["discard"]);
  second.resolve(["current"]);
  await flush();
  assert.deepEqual(h.render(fetcher, []).data, ["current"]);
  const pending = h.render(fetcher, []).refresh();
  h.unmount();
  const count = h.updates();
  await pending;
  assert.equal(h.updates(), count);
});

test("a successful edit cannot be undone by an older background response", async () => {
  const h = harness(),
    poll = deferred();
  let calls = 0;
  const fetcher = () =>
    ++calls === 1 ? Promise.resolve(["before"]) : poll.promise;
  h.render(fetcher, ["a"]);
  await flush();
  const background = h.quiet();
  h.render(fetcher, ["a"]).setData(["saved"]);
  poll.resolve(["stale"]);
  await background;
  const view = h.render(fetcher, ["a"]);
  assert.deepEqual(view.data, ["saved"]);
  assert.equal(view.loading, false);
  assert.equal(view.error, null);
});

test("local edits finish foreground loading and supersede its eventual failure", async () => {
  const h = harness(),
    request = deferred();
  const fetcher = () => request.promise;
  h.render(fetcher, ["a"]).setData(["saved"]);
  request.reject(new Error("late failure"));
  await flush();
  const view = h.render(fetcher, ["a"]);
  assert.deepEqual(view.data, ["saved"]);
  assert.equal(view.loading, false);
  assert.equal(view.error, null);
});

test("setData from a previous filial is ignored after switching scope", async () => {
  const h = harness(),
    fetcher = () => Promise.resolve([]);
  h.render(fetcher, ["a"]);
  await flush();
  const old = h.render(fetcher, ["a"]);
  h.render(fetcher, ["b"]);
  await flush();
  old.setData(["wrong tenant"]);
  assert.deepEqual(h.render(fetcher, ["b"]).data, []);
});

test("ODS summary polling cannot overwrite a freshly saved task", async () => {
  const poll = deferred();
  let reads = 0;
  const before = { total: 10, tasks: [], warnings: [] },
    saved = { total: 30, tasks: [{ id: "task" }], warnings: [] };
  const h = harness({
    getOrderSummary: () =>
      ++reads === 1 ? Promise.resolve(before) : poll.promise,
    addTask: () => Promise.resolve(saved),
  });
  h.render("one");
  await flush();
  const background = h.quiet();
  await h.render("one").addTask("catalog");
  poll.resolve(before);
  await background;
  assert.deepEqual(h.render("one").summary, saved);
});

test("an old ODS mutation cannot populate the next order's summary", async () => {
  const mutation = deferred();
  const first = { total: 1, tasks: [] },
    second = { total: 2, tasks: [] };
  const h = harness({
    getOrderSummary: (id) => Promise.resolve(id === "one" ? first : second),
    addTask: () => mutation.promise,
  });
  h.render("one");
  await flush();
  const pending = h.render("one").addTask("catalog");
  h.render("two");
  await flush();
  mutation.resolve({ ...first, total: 99 });
  await pending;
  assert.deepEqual(h.render("two").summary, second);
});

test("ODS summary exposes load failures for retry without an unhandled rejection", async () => {
  let failing = true;
  const saved = { total: 25, tasks: [] };
  const h = harness({
    getOrderSummary: () =>
      failing
        ? Promise.reject(new Error("Connection lost"))
        : Promise.resolve(saved),
  });
  h.render("one");
  await flush();
  const failed = h.render("one");
  assert.equal(failed.error.message, "Connection lost");
  assert.equal(failed.loading, false);
  failing = false;
  await failed.refresh();
  assert.deepEqual(h.render("one").summary, saved);
  assert.equal(h.render("one").error, null);
});

test("editing before the first load revalidates the whole list without losing saved rows", async () => {
  const h = harness(),
    initial = deferred();
  let calls = 0;
  const fetcher = () =>
    ++calls === 1 ? initial.promise : Promise.resolve(["saved", "other"]);
  const view = h.render(fetcher, ["a"]);
  view.setData((current) => ["saved", ...current]);
  await flush();
  initial.resolve(["other"]);
  await flush();
  assert.deepEqual(h.render(fetcher, ["a"]).data, ["saved", "other"]);
  assert.equal(h.render(fetcher, ["a"]).loading, false);
});

test("warehouse transition returns the updated request and prevents double submission", async () => {
  const gate = deferred();
  let calls = 0,
    lists = 0;
  const api = {
    listServiceOrderRequests: async () => [
      { id: "odt", stage: ++lists === 1 ? "pendiente" : "en_progreso" },
    ],
    startServiceOrderRequest: async () => {
      calls++;
      await gate.promise;
    },
    completeServiceOrderRequest: async () => {},
    acknowledgeServiceOrderRequest: async () => {},
  };
  const h = harness(null, api);
  h.render("A");
  await new Promise(setImmediate);
  const hook = h.render("A");
  const first = hook.start("odt");
  const duplicate = await hook.start("odt");
  assert.equal(duplicate, null);
  assert.equal(calls, 1);
  gate.resolve();
  assert.equal((await first).stage, "en_progreso");
  assert.equal(h.render("A").requests[0].stage, "en_progreso");
  h.unmount();
});
test("failed warehouse transition keeps the current request and exposes its error", async () => {
  const api = {
    listServiceOrderRequests: async () => [{ id: "odt", stage: "pendiente" }],
    startServiceOrderRequest: async () => {
      throw new Error("Falta stock");
    },
  };
  const h = harness(null, api);
  h.render("A");
  await new Promise(setImmediate);
  assert.equal(await h.render("A").start("odt"), null);
  assert.equal(h.render("A").requests[0].stage, "pendiente");
  assert.equal(h.render("A").actionError.message, "Falta stock");
  h.unmount();
});
test("late warehouse action cannot replace another filial's requests", async () => {
  const gate = deferred();
  const api = {
    listServiceOrderRequests: async (filial) => [
      { id: filial, stage: "pendiente" },
    ],
    startServiceOrderRequest: async () => gate.promise,
  };
  const h = harness(null, api);
  h.render("A");
  await new Promise(setImmediate);
  const mutation = h.render("A").start("A");
  h.render("B");
  await new Promise(setImmediate);
  gate.resolve();
  assert.equal(await mutation, null);
  assert.equal(h.render("B").requests[0].id, "B");
  h.unmount();
});

test("warehouse refresh preserves queue position and publishes server-confirmed stages", async () => {
  let rows = [
    { id: "a", stage: "pendiente" },
    { id: "b", stage: "pendiente" },
  ];
  const h = harness(null, {
    listServiceOrderRequests: async () => rows,
    startServiceOrderRequest: async () => {
      rows = [
        { id: "b", stage: "pendiente" },
        { id: "a", stage: "en_progreso" },
      ];
    },
  });
  h.render("A");
  await flush();
  await h.render("A").start("a");
  assert.deepEqual(
    h.render("A").requests.map((x) => [x.id, x.stage]),
    [
      ["a", "en_progreso"],
      ["b", "pendiente"],
    ],
  );
  rows = [
    { id: "c", stage: "pendiente" },
    { id: "b", stage: "por_retirar" },
    { id: "a", stage: "completado" },
  ];
  await h.quiet();
  assert.deepEqual(
    h.render("A").requests.map((x) => x.id),
    ["a", "b", "c"],
  );
  assert.equal(h.render("A").requests[0].stage, "completado");
  rows = [
    { id: "c", stage: "pendiente" },
    { id: "b", stage: "por_retirar" },
  ];
  await h.quiet();
  assert.deepEqual(
    h.render("A").requests.map((x) => x.id),
    ["b", "c"],
  );
  h.unmount();
});
