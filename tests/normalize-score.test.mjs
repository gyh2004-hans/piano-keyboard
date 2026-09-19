import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScore, selectRange } from '../scripts/lib/normalize.mjs';

const base = {
  schemaVersion: '1.0', id: 'x', title: 'X', bars: 3,
  timeSignature: [4, 4], ticksPerBeat: 4,
  tempoMap: [{ bar: 1, tick: 0, bpm: 100 }], uncertainties: [],
  events: [
    { bar: 2, tick: 0, duration: 4, hand: 'R', notes: ['G4', 'E4', 'E4'], tie: false },
    { bar: 1, tick: 8, duration: 12, hand: 'R', notes: ['C4'], tie: true },
    { bar: 2, tick: 0, duration: 2, hand: 'R', notes: ['C5'], tie: false },
    { bar: 2, tick: 0, duration: 4, hand: 'L', notes: ['C3'], tie: false }
  ]
};

test('normalizes without mutating input', () => {
  const copy = structuredClone(base);
  const out = normalizeScore(base);
  assert.deepEqual(base, copy);
  assert.deepEqual(out.events.map(e => e.hand), ['R', 'L', 'R']);
  assert.deepEqual(out.events[2].notes, ['E4', 'G4', 'C5']);
  assert.match(out.events[0].id, /^1-8-R-/);
});

test('selectRange adds a continuation at the range entrance', () => {
  const out = selectRange(normalizeScore(base), { from: 2, to: 2, hand: 'R' });
  const continuation = out.events.find(e => e.continuation);
  assert.deepEqual(continuation.notes, ['C4']);
  assert.equal(continuation.bar, 2);
  assert.equal(continuation.tick, 0);
  assert.equal(continuation.duration, 4);
});
