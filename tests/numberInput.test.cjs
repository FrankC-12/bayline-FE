const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/numberInput.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exportsObject });
const { displayNumberInput: display, parseNumberInput: parse } = exportsObject;

test('formats canonical values without rounding exchange rates or removing editable zeros', () => {
  for (const [raw, shown] of [['', ''], ['1234', '1.234'], ['1234567.50', '1.234.567,50'], ['0.', '0,'], ['-1234.05', '-1.234,05'], ['1234.12345678', '1.234,12345678']]) {
    assert.equal(display(raw), shown);
    assert.equal(parse(shown, 8, true), raw);
  }
});
test('pastes Venezuelan amounts and ungrouped dot-decimal amounts', () => {
  for (const [text, raw] of [['Bs. 1.234.567,89', '1234567.89'], ['1234567.89', '1234567.89'], ['1.234', '1234'], ['1.234.567', '1234567'], ['0,05', '0.05'], [',5', '0.5']]) assert.equal(parse(text, 2), raw);
});
test('typing through successive thousands keeps the stored quantity intact', () => {
  let raw = '';
  for (const digit of '123456789') raw = parse((display(raw) + digit).replace(/\./g, ''), 2);
  assert.equal(raw, '123456789');
  assert.equal(display(raw), '123.456.789');
  raw = parse((display(raw) + ',50').replace(/\./g, ''), 2);
  assert.equal(raw, '123456789.50');
  assert.equal(Number(raw), 123456789.5);
});
test('clearing, precision limits and negative balances', () => {
  assert.equal(parse('', 2), '');
  assert.equal(parse('1.234,5678', 2), '1234.56');
  assert.equal(parse('1.234,5', 0), '1234');
  assert.equal(parse('-1.234,50', 2, true), '-1234.50');
  assert.equal(parse('-1.234,50', 2), '1234.50');
  assert.equal(parse('00123,00', 2), '123.00');
});
