import test from 'node:test';
import assert from 'node:assert/strict';
import { PracticeModel, makeClock, MODES } from '../scripts/lib/practice-model.mjs';

const score = {
  bars: 2, timeSignature: [4, 4], ticksPerBeat: 4,
  tempoMap: [{ bar: 1, tick: 0, bpm: 60 }, { bar: 2, tick: 0, bpm: 120 }],
  events: [
    { id: 'l1', bar: 1, tick: 0, duration: 8, hand: 'L', notes: ['C3'] },
    { id: 'r1', bar: 1, tick: 0, duration: 8, hand: 'R', notes: ['C4', 'E4'] },
    { id: 'r2', bar: 1, tick: 12, duration: 2, hand: 'R', notes: ['G4'] },
    { id: 'r3', bar: 2, tick: 0, duration: 4, hand: 'R', notes: ['G4'] }
  ]
};

test('tempo clock honors tempo changes', () => {
  const clock = makeClock(score, 1);
  assert.equal(clock.at(16), 4);
  assert.equal(clock.at(20), 4.5);
});

test('requires a full chord before advancing', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume();
  assert.equal(model.press('C4'), 'partial');
  assert.equal(model.index, 0);
  assert.equal(model.press('E4'), 'correct');
  assert.equal(model.index, 1);
});

test('early release ends sound without pausing score time', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume(); model.press('C4'); model.press('E4'); model.release('C4'); model.release('E4');
  model.update(2);
  assert.equal(model.time, 2);
  assert.equal(model.waiting, false);
});

test('rests advance naturally and repeated notes require release', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume(); model.press('C4'); model.press('E4'); model.release('C4'); model.release('E4');
  model.update(3);
  assert.equal(model.time, 3);
  assert.equal(model.press('G4'), 'correct');
  model.update(1);
  assert.equal(model.press('G4'), 'ignored');
  model.release('G4');
  assert.equal(model.press('G4'), 'correct');
});

test('supports all six declared modes and accompaniment waits with the user', () => {
  assert.deepEqual(MODES, ['auto', 'both', 'right', 'left', 'demo', 'free']);
  const model = new PracticeModel(score, { mode: 'auto' });
  model.resume(); model.update(1);
  assert.equal(model.time, 0);
  assert.equal(model.backingIndex, 0);
});

test('pause clears all held voices', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume(); model.press('C4'); model.pause();
  assert.equal(model.held.size, 0);
  assert.equal(model.paused, true);
});
