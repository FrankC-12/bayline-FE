const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Render the real component with controlled hooks and API completion order.
function harness(decide, readOnly = false) {
  const slots = [];
  let cursor = 0, removed = [], applied = 0;
  const recommendation = { id: 'finding', title: 'Fuga de refrigerante', description: 'Revisar fuga',
    severity: 'monitorear', amount: 0, photo_urls: [], created_at: '2026-10-16T12:00:00Z',
    origin_service_order_code: 'ODS-2007' };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,
    '../src/components/service-orders/PendingUpsellsBlock.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'module', 'exports', 'React', code)(name => {
    if (name === 'react') return react;
    if (name === 'lucide-react') return {};
    if (name === '@/hooks/usePendingUpsells') return { usePendingUpsells: () => ({
      pendingUpsells: removed.length ? [] : [recommendation], loading: false,
      remove: id => removed.push(id),
    }) };
    if (name === '@/contexts/UpsellsContext') return { useUpsellsContext: () => ({ decide }) };
    if (name === '@/components/common/Modal') return { default: 'Modal' };
    if (name === './DiscardUpsellModal') return { default: 'DiscardUpsellModal' };
    throw new Error(`Unexpected dependency: ${name}`);
  }, mod, mod.exports, react);
  const render = () => { cursor = 0; return mod.exports.default({
    vehicleId: 'vehicle', orderId: 'current-order', readOnly, onApplied: async () => { applied++; },
  }); };
  return { render, removed, applied: () => applied };
}
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...(node.props?.children ?? []).flat(Infinity).flatMap(elements)];
}
function button(tree, label) {
  return elements(tree).find(n => n.type === 'button' && n.props.children.flat(Infinity).includes(label));
}
function applyModal(tree) {
  return elements(tree).find(n => typeof n.type === 'function' && n.type.name === 'ApplyToOrderModal');
}

test('approval uses the shared decision and applies once to the current ODS', async () => {
  let resolve, calls = [];
  const pending = new Promise(yes => { resolve = yes; });
  const h = harness((...args) => { calls.push(args); return pending; });
  button(h.render(), 'Agregar a esta ODS').props.onClick();
  const modal = applyModal(h.render());
  const first = modal.props.onConfirm('whatsapp');
  await modal.props.onConfirm('whatsapp');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['finding', { status: 'aprobado', approval_channel: 'whatsapp',
    target_service_order_id: 'current-order' }]);
  assert.ok(elements(h.render()).filter(n => n.type === 'button').every(n => n.props.disabled));
  resolve({ status: 'aprobado' });
  await first;
  assert.deepEqual(h.removed, ['finding']);
  assert.equal(h.applied(), 1);
  assert.equal(h.render(), null);
});

test('a rejected approval stays visible, shows the API error and allows retry', async () => {
  let attempts = 0;
  const h = harness(async () => {
    if (++attempts === 1) throw new Error('No hay stock disponible');
    return { status: 'aprobado' };
  });
  button(h.render(), 'Agregar a esta ODS').props.onClick();
  await applyModal(h.render()).props.onConfirm('presencial');
  assert.deepEqual(h.removed, []);
  assert.equal(h.applied(), 0);
  assert.equal(applyModal(h.render()).props.error, 'No hay stock disponible');
  await applyModal(h.render()).props.onConfirm('presencial');
  assert.equal(attempts, 2);
  assert.equal(h.applied(), 1);
});

test('discard updates the shared upsell state and does not add ODS lines', async () => {
  const calls = [];
  const h = harness(async (...args) => { calls.push(args); });
  button(h.render(), 'Descartar').props.onClick();
  const modal = elements(h.render()).find(n => n.type === 'DiscardUpsellModal');
  await modal.props.onConfirm('ya_no_aplica', undefined);
  assert.deepEqual(calls[0], ['finding', { status: 'rechazado', discard_reason: 'ya_no_aplica', discard_note: undefined }]);
  assert.equal(h.applied(), 0);
  assert.deepEqual(h.removed, ['finding']);
});

test('closed orders cannot apply recommendations and keeping pending does not decide them', () => {
  const h = harness(() => { throw new Error('Must not submit a decision'); }, true);
  assert.equal(button(h.render(), 'Agregar a esta ODS'), undefined);
  button(h.render(), 'Mantener pendiente').props.onClick();
  assert.equal(h.render(), null);
  assert.equal(h.applied(), 0);
});
