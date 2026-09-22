import { midi } from './score.mjs';

export const STANDARD_LABELS = [..."Q2W3ER5T6Y7UI9O0PZSXDCFVBHNJM,L.;/'"];
export const SUPPLEMENTAL_LABELS = ['A', 'G', 'K', '1', '4', '8'];
export const ALLOWED_LABELS = [...STANDARD_LABELS];

const SPECIAL_CODES = {
  ',': 'Comma', '.': 'Period', ';': 'Semicolon', '/': 'Slash', "'": 'Quote',
  '[': 'BracketLeft', ']': 'BracketRight', '-': 'Minus', '=': 'Equal'
};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function codeFor(label) {
  return SPECIAL_CODES[label] || `${/^\d$/.test(label) ? 'Digit' : 'Key'}${label}`;
}

function noteFromMidi(value) {
  return `${NOTE_NAMES[value % 12]}${Math.floor(value / 12) - 1}`;
}

export const STANDARD_KEYS = STANDARD_LABELS.map((label, x) => ({
  label, code: codeFor(label), x, base: 48 + x, hand: x < 17 ? 'L' : 'R'
}));
export const SUPPLEMENTAL_KEYS = SUPPLEMENTAL_LABELS.map(label => ({
  label, code: codeFor(label), supplemental: true
}));
// Backward-compatible name for consumers that only need the standard bank.
export const KEYS = STANDARD_KEYS;

function uniqueTargets(targets) {
  const unique = new Map();
  for (const target of targets) {
    const existing = unique.get(target.note);
    if (!existing) unique.set(target.note, { ...target, hands: [...new Set(target.hands || [])] });
    else existing.hands = [...new Set([...existing.hands, ...(target.hands || [])])];
  }
  return [...unique.values()];
}

function previousMetadata(previous) {
  const fallback = [...previous.values()].find(binding => Number.isFinite(binding.shift))?.shift || 0;
  const shift = Number.isFinite(previous.shift) ? previous.shift : fallback;
  return {
    shift,
    shifts: previous.shifts || { L: shift, R: shift },
    split: Number.isFinite(previous.split) ? previous.split : 17
  };
}

function lexicographicallyBefore(left, right) {
  return left.some((value, index) => value < right[index] && left.slice(0, index).every((item, i) => item === right[i]));
}

export function allocate(inputTargets, previous = new Map(), locks = new Map()) {
  const requested = inputTargets.map(target => ({ ...target, hands: [...(target.hands || [])] }));
  const targets = uniqueTargets(requested);
  const wanted = targets.map(target => target.note);
  const old = previousMetadata(previous);
  const candidates = [];

  for (let shift = -48; shift <= 72; shift += 12) {
    const conflicts = wanted.filter(note => {
      const pitch = midi(note);
      if ([...locks.values()].some(locked => midi(locked) === pitch)) return false;
      const key = STANDARD_KEYS[pitch - 48 - shift];
      return !key || (locks.has(key.code) && midi(locks.get(key.code)) !== pitch);
    }).length;
    candidates.push({ shift, conflicts });
  }
  candidates.sort((a, b) => a.conflicts - b.conflicts
    || Math.abs(a.shift - old.shift) - Math.abs(b.shift - old.shift)
    || Math.abs(a.shift) - Math.abs(b.shift));

  let shift = candidates[0]?.shift ?? old.shift;
  let shifts = { L: shift, R: shift };
  let split = 17;
  let dual = false;

  if (candidates[0]?.conflicts) {
    const pitches = wanted.map(midi);
    const hands = wanted.map(note => targets.find(target => target.note === note)?.hands || []);
    let best;
    const boundaries = [17, ...Array.from({ length: 15 }, (_, i) => i + 10).filter(value => value !== 17)];
    for (const boundary of boundaries) {
      const bankOptions = ['L', 'R'].map((hand, bank) => {
        const options = [];
        for (let offset = -48; offset <= 72; offset += 12) {
          const covered = new Set();
          const matched = new Set();
          for (let i = 0; i < pitches.length; i++) {
            const x = pitches[i] - 48 - offset;
            const key = STANDARD_KEYS[x];
            const inBank = bank === 0 ? x < boundary : x >= boundary;
            if (key && inBank && (!locks.has(key.code) || midi(locks.get(key.code)) === pitches[i])) {
              covered.add(i);
              if (hands[i].includes(hand)) matched.add(i);
            }
          }
          for (const [code, pitch] of locks) {
            const key = STANDARD_KEYS.find(item => item.code === code);
            if (!key || (bank === 0 ? key.x >= boundary : key.x < boundary)) continue;
            const index = pitches.indexOf(midi(pitch));
            if (index >= 0) {
              covered.add(index);
              if (hands[index].includes(hand)) matched.add(index);
            }
          }
          options.push({ offset, covered, matched });
        }
        return options;
      });
      for (const left of bankOptions[0]) for (const right of bankOptions[1]) {
        const missing = pitches.length - new Set([...left.covered, ...right.covered]).size;
        const mismatch = pitches.length - new Set([...left.matched, ...right.matched]).size;
        const movement = Math.abs(left.offset - old.shifts.L) + Math.abs(right.offset - old.shifts.R);
        const rank = [missing, mismatch, movement, Math.abs(boundary - old.split), Math.abs(left.offset) + Math.abs(right.offset)];
        if (!best || lexicographicallyBefore(rank, best.rank)) best = { rank, split: boundary, shifts: { L: left.offset, R: right.offset } };
      }
      if (best?.rank[0] === 0 && boundary === 17) break;
    }
    if (best && best.rank[0] < candidates[0].conflicts) {
      shifts = best.shifts;
      split = best.split;
      dual = shifts.L !== shifts.R;
      shift = shifts.L;
    }
  }

  const byCode = new Map();
  const assigned = new Map();
  for (const key of STANDARD_KEYS) {
    const hand = key.x < split ? 'L' : 'R';
    const offset = shifts[hand];
    const pitch = key.base + offset;
    if (pitch >= 0 && pitch <= 127) byCode.set(key.code, { ...key, hand, note: noteFromMidi(pitch), shift: offset });
  }

  for (const [code, pitch] of locks) {
    const key = [...STANDARD_KEYS, ...SUPPLEMENTAL_KEYS].find(item => item.code === code);
    if (!key) continue;
    const hand = key.supplemental ? (previous.get(code)?.hand || 'R') : (key.x < split ? 'L' : 'R');
    byCode.set(code, {
      ...key, hand, note: pitch, shift: key.supplemental ? 0 : midi(pitch) - key.base, locked: true
    });
  }

  for (const pitch of wanted) {
    const hands = targets.find(target => target.note === pitch)?.hands || [];
    const bindings = [...byCode.values()].filter(binding => midi(binding.note) === midi(pitch));
    bindings.sort((a, b) => Number(b.locked || false) - Number(a.locked || false)
      || Number(hands.includes(b.hand)) - Number(hands.includes(a.hand)));
    const binding = bindings[0];
    if (!binding) continue;
    const targetBinding = { ...binding, note: pitch };
    byCode.set(binding.code, targetBinding);
    assigned.set(pitch, targetBinding);
  }

  const supplemental = [];
  for (const pitch of wanted) {
    if (assigned.has(pitch)) continue;
    const available = SUPPLEMENTAL_KEYS.filter(key => !byCode.has(key.code));
    available.sort((a, b) => Number(previous.get(b.code)?.note === pitch) - Number(previous.get(a.code)?.note === pitch));
    const key = available[0];
    if (!key) continue;
    const binding = {
      ...key, note: pitch, hand: targets.find(target => target.note === pitch)?.hands?.[0] || 'R', shift: 0
    };
    byCode.set(key.code, binding);
    assigned.set(pitch, binding);
    supplemental.push(binding);
  }

  Object.assign(byCode, { shift, shifts, dual, split });
  return {
    byCode, targets: assigned, requested, blocked: assigned.size !== wanted.length,
    shift, shifts, dual, split, supplemental
  };
}
