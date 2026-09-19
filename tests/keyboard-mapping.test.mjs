import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LABELS, KEYS, allocate, simplifyTargets } from '../scripts/lib/keyboard-mapping.mjs';

const target = (note, hand = 'R', role = hand === 'R' ? 'melody' : 'accompaniment') => ({ note, hands: [hand], role });

test('uses exactly the Q-P and A-L rows', () => {
  assert.deepEqual(ALLOWED_LABELS, [...'QWERTYUIOPASDFGHJKL']);
});

test('orders pitches left to right and favors home keys', () => {
  const result = allocate([target('C4'), target('E4'), target('G4')]);
  const bindings = ['C4', 'E4', 'G4'].map(note => result.targets.get(note));
  assert.ok(bindings.every(Boolean));
  assert.ok(bindings.every((x, i, a) => i === 0 || a[i - 1].x <= x.x));
  assert.ok(bindings.every(x => 'JKLP'.includes(x.label)));
});

test('reuses prior bindings and preserves held locks', () => {
  const first = allocate([target('C4'), target('E4')]);
  const second = allocate([target('C4'), target('G4')], first.byCode);
  assert.equal(second.targets.get('C4').label, first.targets.get('C4').label);
  const locks = new Map([['KeyA', 'C3']]);
  const locked = allocate([target('C3', 'L'), target('E3', 'L')], new Map(), locks);
  assert.equal(locked.byCode.get('KeyA').note, 'C3');
});

test('keeps left and right voices in their typing zones', () => {
  const result = allocate([target('C3', 'L'), target('E3', 'L'), target('C5'), target('E5')]);
  assert.ok(['L'].includes(result.targets.get('C3').hand));
  assert.ok(['R'].includes(result.targets.get('C5').hand));
});

test('simplifies over-capacity accompaniment without deleting melody', () => {
  const many = Array.from({ length: 22 }, (_, i) => target(`C${2 + Math.floor(i / 7)}`, 'L', i === 21 ? 'melody' : 'accompaniment'));
  many[21] = target('C7', 'R', 'melody');
  const out = simplifyTargets(many);
  assert.ok(out.targets.some(x => x.note === 'C7' && x.role === 'melody'));
  assert.ok(out.targets.length <= KEYS.length);
  assert.ok(out.removed.length > 0);
});
