const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const calendar = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/calendar.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: calendar });
const { calendarDate, calendarHour, calendarTimestamp, shiftCalendarDate, scheduledOrdersForDate, calendarLayout, UNASSIGNED_BAY } = calendar;

test('today and scheduled day use Caracas even after UTC midnight', () => {
  assert.equal(calendarDate('2026-10-02T02:30:00Z'), '2026-10-01');
  assert.equal(calendarHour('2026-10-02T02:30:00Z'), 22);
  assert.equal(calendarHour('2026-10-02T04:00:00Z'), 0);
  assert.equal(calendarTimestamp('2026-10-01', '08:30'), '2026-10-01T12:30:00.000Z');
  assert.equal(calendarTimestamp('2026-10-01', '22:30'), '2026-10-02T02:30:00.000Z');
});
test('navigation crosses month/year boundaries without using device timezone', () => {
  assert.equal(shiftCalendarDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftCalendarDate('2026-10-01', -1), '2026-09-30');
});
test('new appointments and reschedules only appear on their workshop day', () => {
  const orders = [
    { id: 'late', scheduled_at: '2026-10-02T02:30:00Z' },
    { id: 'tomorrow', scheduled_at: '2026-10-02T12:00:00Z' },
    { id: 'walk-in', scheduled_at: null },
  ];
  assert.equal(scheduledOrdersForDate(orders, '2026-10-01').map(o => o.id).join(), 'late');
  assert.equal(scheduledOrdersForDate(orders, '2026-10-02').map(o => o.id).join(), 'tomorrow');
  orders[0].scheduled_at = calendarTimestamp('2026-10-02', '08:30');
  assert.equal(scheduledOrdersForDate(orders, '2026-10-01').length, 0);
  assert.equal(scheduledOrdersForDate(orders, '2026-10-02').length, 2);
});
test('every scheduled appointment has a visible grid cell, even without active bays', () => {
  const orders = [
    { bay_id: null, scheduled_at: '2026-10-01T12:00:00Z' },
    { bay_id: 'inactive', scheduled_at: '2026-10-01T11:00:00Z' },
    { bay_id: 'missing', scheduled_at: '2026-10-02T02:00:00Z' },
  ];
  const bays = [{ id: 'inactive', name: 'Bahía 1', is_active: false }];
  for (const available of [bays, []]) {
    const layout = calendarLayout(orders, available);
    for (const order of orders) {
      assert.ok(layout.columns.some(b => b.id === (order.bay_id ?? UNASSIGNED_BAY)));
      assert.ok(layout.hours.includes(calendarHour(order.scheduled_at)));
    }
  }
  assert.equal(bays.length, 1);
});
