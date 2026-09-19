import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { midi, validateScore } from '../scripts/lib/score.mjs';

const fixture = JSON.parse(await readFile(new URL('../examples/public-domain-score/score.json', import.meta.url)));

test('accepts the confirmed public-domain fixture', () => {
  assert.equal(validateScore(fixture, { requireConfirmed: true }).title, 'Public Domain Exercise');
});

test('converts flats and sharps to MIDI numbers', () => {
  assert.equal(midi('C4'), 60);
  assert.equal(midi('Bb3'), 58);
  assert.equal(midi('F#4'), 66);
});

test('rejects an illegal pitch with its field path', () => {
  const score = structuredClone(fixture);
  score.events[0].notes = ['H4'];
  assert.throws(() => validateScore(score), /events\[0\]\.notes\[0\]/);
});

test('rejects invalid durations, hands, tempos, and bar positions', () => {
  for (const mutate of [
    s => { s.events[0].duration = -1; },
    s => { s.events[0].hand = 'M'; },
    s => { s.tempoMap[0].bpm = 0; },
    s => { s.events[0].bar = s.bars + 1; }
  ]) {
    const score = structuredClone(fixture);
    mutate(score);
    assert.throws(() => validateScore(score));
  }
});

test('rejects unresolved recognition uncertainty before generation', () => {
  const score = structuredClone(fixture);
  score.uncertainties.push({ status: 'open', page: 1, bar: 2, message: 'D4 or Eb4' });
  assert.throws(() => validateScore(score, { requireConfirmed: true }), /uncertainties/);
});
