import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LABELS, STANDARD_KEYS, allocate } from '../scripts/lib/keyboard-mapping.mjs';
import { midi } from '../scripts/lib/score.mjs';

const target = (note, hand = 'R', role = hand === 'R' ? 'melody' : 'accompaniment') => ({ note, hands: [hand], role });
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteFromMidi = value => `${NAMES[value % 12]}${Math.floor(value / 12) - 1}`;

test('uses the fixed 35-key chromatic layout', () => {
  assert.deepEqual(ALLOWED_LABELS, [..."Q2W3ER5T6Y7UI9O0PZSXDCFVBHNJM,L.;/'"]);
  assert.equal(STANDARD_KEYS.length, 35);
  assert.deepEqual(STANDARD_KEYS.map(key => key.base), Array.from({ length: 35 }, (_, i) => 48 + i));
});

test('moves one shared octave bank without folding intervals', () => {
  const result = allocate([target('C3', 'L'), target('E4'), target('G4')]);
  assert.equal(result.blocked, false);
  assert.equal(result.shifts.L, result.shifts.R);
  assert.equal(midi(result.targets.get('G4').note) - midi(result.targets.get('E4').note), 3);
});

test('uses independent hand banks for a wide two-hand group', () => {
  const result = allocate([target('C2', 'L'), target('G2', 'L'), target('E5'), target('B5')]);
  assert.equal(result.blocked, false);
  assert.equal(result.dual, true);
  assert.notEqual(result.shifts.L, result.shifts.R);
});

test('locks a held physical code to its original pitch', () => {
  const first = allocate([target('C4')]);
  const code = first.targets.get('C4').code;
  const next = allocate([target('C6')], first.byCode, new Map([[code, 'C4']]));
  assert.equal(next.byCode.get(code).note, 'C4');
  assert.equal(next.byCode.get(code).locked, true);
});

test('reports explicit supplemental bindings for three-octave unisons', () => {
  const result = allocate([target('B3', 'L'), target('B4'), target('B5')]);
  assert.equal(result.blocked, false);
  assert.ok([...result.byCode.values()].some(binding => binding.supplemental));
  assert.ok(result.supplemental.length > 0);
});

test('does not mutate or silently discard a blocked input group', () => {
  const targets = Array.from({ length: 42 }, (_, i) => target(noteFromMidi(30 + i), i < 21 ? 'L' : 'R'));
  const before = structuredClone(targets);
  const result = allocate(targets);
  assert.deepEqual(targets, before);
  assert.equal(result.blocked, true);
  assert.equal(result.requested.length, targets.length);
});
