import { midi, validateScore } from './score.mjs';

const positionOf = (event, barTicks) => (event.bar - 1) * barTicks + event.tick;

export function normalizeScore(input) {
  validateScore(input);
  const score = structuredClone(input);
  const barTicks = score.timeSignature[0] * score.ticksPerBeat;
  const groups = new Map();
  for (const event of score.events) {
    const key = `${event.bar}:${event.tick}:${event.hand}`;
    const old = groups.get(key);
    if (!old) groups.set(key, { ...event, notes: [...new Set(event.notes)].sort((a, b) => midi(a) - midi(b)) });
    else {
      old.notes = [...new Set([...old.notes, ...event.notes])].sort((a, b) => midi(a) - midi(b));
      old.duration = Math.max(old.duration, event.duration);
      old.tie = Boolean(old.tie || event.tie);
    }
  }
  score.events = [...groups.values()].sort((a, b) => positionOf(a, barTicks) - positionOf(b, barTicks) || a.hand.localeCompare(b.hand));
  const counters = new Map();
  for (const event of score.events) {
    const base = `${event.bar}-${event.tick}-${event.hand}`;
    const index = counters.get(base) || 0;
    counters.set(base, index + 1);
    event.id = `${base}-${index}`;
  }
  score.tempoMap.sort((a, b) => positionOf(a, barTicks) - positionOf(b, barTicks));
  return score;
}

export function selectRange(input, { from = 1, to = input.bars, hand = 'both' } = {}) {
  const score = normalizeScore(input);
  const barTicks = score.timeSignature[0] * score.ticksPerBeat;
  const start = (from - 1) * barTicks;
  const end = to * barTicks;
  const allowed = hand === 'both' ? ['L', 'R'] : [hand];
  const events = [];
  for (const event of score.events) {
    if (!allowed.includes(event.hand)) continue;
    const position = positionOf(event, barTicks);
    const eventEnd = position + event.duration;
    if (position >= start && position < end) events.push(structuredClone(event));
    else if (position < start && eventEnd > start) events.push({ ...structuredClone(event), id: `${event.id}-continuation`, bar: from, tick: 0, duration: Math.min(eventEnd, end) - start, continuation: true, tie: true });
  }
  return { ...score, bars: to - from + 1, range: { from, to }, events };
}
