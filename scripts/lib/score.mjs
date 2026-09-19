export const PITCH_RE = /^([A-G])([#b]?)(-?\d+)$/;
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function midi(note) {
  const match = PITCH_RE.exec(note);
  if (!match) throw new TypeError(`Invalid pitch: ${note}`);
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  const value = (Number(match[3]) + 1) * 12 + SEMITONES[match[1]] + accidental;
  if (value < 0 || value > 127) throw new RangeError(`Pitch outside MIDI range: ${note}`);
  return value;
}

function positiveInteger(value) { return Number.isInteger(value) && value > 0; }

export function validateScore(score, { requireConfirmed = false } = {}) {
  const errors = [];
  if (!score || typeof score !== 'object' || Array.isArray(score)) errors.push('$ must be an object');
  if (errors.length) throw new AggregateError(errors.map(x => new Error(x)), errors.join('\n'));
  if (score.schemaVersion !== '1.0') errors.push('schemaVersion must equal "1.0"');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(score.id || '')) errors.push('id must use lowercase letters, digits, and hyphens');
  if (typeof score.title !== 'string' || !score.title.trim()) errors.push('title must be a non-empty string');
  if (!positiveInteger(score.bars)) errors.push('bars must be a positive integer');
  if (!Array.isArray(score.timeSignature) || score.timeSignature.length !== 2 || !score.timeSignature.every(positiveInteger)) errors.push('timeSignature must contain two positive integers');
  if (!positiveInteger(score.ticksPerBeat)) errors.push('ticksPerBeat must be a positive integer');
  const barTicks = (score.timeSignature?.[0] || 0) * (score.ticksPerBeat || 0);
  if (!Array.isArray(score.tempoMap) || !score.tempoMap.length) errors.push('tempoMap must contain at least one entry');
  else score.tempoMap.forEach((tempo, i) => {
    if (!positiveInteger(tempo.bar) || tempo.bar > score.bars) errors.push(`tempoMap[${i}].bar is outside the score`);
    if (!Number.isInteger(tempo.tick) || tempo.tick < 0 || tempo.tick >= barTicks) errors.push(`tempoMap[${i}].tick is outside its bar`);
    if (!(Number.isFinite(tempo.bpm) && tempo.bpm > 0)) errors.push(`tempoMap[${i}].bpm must be positive`);
  });
  if (!Array.isArray(score.events)) errors.push('events must be an array');
  else score.events.forEach((event, i) => {
    if (!positiveInteger(event.bar) || event.bar > score.bars) errors.push(`events[${i}].bar is outside the score`);
    if (!Number.isInteger(event.tick) || event.tick < 0 || event.tick >= barTicks) errors.push(`events[${i}].tick is outside its bar`);
    if (!(Number.isFinite(event.duration) && event.duration > 0)) errors.push(`events[${i}].duration must be positive`);
    if (!['L', 'R'].includes(event.hand)) errors.push(`events[${i}].hand must be L or R`);
    if (!Array.isArray(event.notes) || !event.notes.length) errors.push(`events[${i}].notes must be non-empty`);
    else event.notes.forEach((note, j) => { try { midi(note); } catch { errors.push(`events[${i}].notes[${j}] is not a valid MIDI pitch`); } });
  });
  if (!Array.isArray(score.uncertainties)) errors.push('uncertainties must be an array');
  else if (requireConfirmed && score.uncertainties.some(item => item.status !== 'confirmed')) errors.push('uncertainties contains unresolved items');
  if (errors.length) throw new AggregateError(errors.map(x => new Error(x)), errors.join('\n'));
  return score;
}
