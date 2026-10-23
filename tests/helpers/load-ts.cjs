const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cache = new Map();
function loadTS(filename) {
  const absolute = path.resolve(filename);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} };
  cache.set(absolute, mod);
  const compiled = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("require", "module", "exports", compiled)(
    (name) => {
      if (name.startsWith(".") || name.startsWith("@/")) {
        const stem = name.startsWith("@/")
          ? path.resolve("src", name.slice(2))
          : path.resolve(path.dirname(absolute), name);
        const source = [stem, stem + ".ts", stem + ".tsx"].find(
          (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
        );
        if (source) return loadTS(source);
      }
      return require(name);
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
module.exports = { loadTS };
