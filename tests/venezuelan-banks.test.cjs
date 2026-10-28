const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/venezuelan-banks.ts'), 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText)(mod, mod.exports);
const {detectVenezuelanBank} = mod.exports;
test('identifies a bank while typing and with formatted bank account numbers', () => {
  assert.equal(detectVenezuelanBank('0102', 'transferencia').name, 'Banco de Venezuela');
  assert.equal(detectVenezuelanBank('0134-0000-00-0000000000', 'transferencia').name, 'Banesco');
  assert.equal(detectVenezuelanBank('0105 0000 00 0000000000', 'transferencia').name, 'Mercantil');
});
test('does not infer banks from phone, email, other methods or unknown codes', () => {
  for(const [value, method] of [['04141234567','pago_movil'], ['0102','zelle'], ['0102','efectivo'], ['0102@example.com','transferencia'], ['01160000000000000000','transferencia'], ['99990000000000000000','transferencia']]) assert.equal(detectVenezuelanBank(value, method), null);
});
test('does not guess on incomplete, excessive or malformed numbers', () => {
  for(const value of ['', '010', '0102' + '0'.repeat(17), 'VE01020000000000000000', '0102/0000000000000000']) assert.equal(detectVenezuelanBank(value,'transferencia'), null);
});
