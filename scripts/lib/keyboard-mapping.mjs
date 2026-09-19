import { midi } from './score.mjs';

const PREFERRED = new Set('ASDFJKLP');
export const KEYS = [
  ...[...'QWERTYUIOP'].map((label, x) => ({ label, x, hand: x < 5 ? 'L' : 'R' })),
  ...[...'ASDFGHJKL'].map((label, x) => ({ label, x: x + 0.25, hand: x < 5 ? 'L' : 'R' }))
].map(key => ({ ...key, code: `Key${key.label}` }));
export const ALLOWED_LABELS = [...'QWERTYUIOPASDFGHJKL'];

function uniqueTargets(targets) {
  const notes = new Map();
  for (const target of targets) {
    const old = notes.get(target.note);
    if (!old || target.role === 'melody') notes.set(target.note, { ...target, hands: [...new Set([...(old?.hands || []), ...(target.hands || [])])] });
    else old.hands = [...new Set([...old.hands, ...(target.hands || [])])];
  }
  return [...notes.values()];
}

export function simplifyTargets(targets, capacity = KEYS.length) {
  const unique = uniqueTargets(targets);
  const removed = targets.filter((target, index) => targets.findIndex(x => x.note === target.note) !== index);
  if (unique.length <= capacity) return { targets: unique, removed, simplified: removed.length > 0 };
  const melody = unique.filter(x => x.role === 'melody');
  const accompaniment = unique.filter(x => x.role !== 'melody');
  if (melody.length > capacity) return { targets: melody.slice(0, capacity), removed: [...removed, ...melody.slice(capacity), ...accompaniment], simplified: true, blocked: true };
  const keep = [...melody];
  const sorted = accompaniment.sort((a, b) => {
    const aRoot = a.role === 'bass' ? 0 : 1;
    const bRoot = b.role === 'bass' ? 0 : 1;
    return aRoot - bRoot || midi(a.note) - midi(b.note);
  });
  for (const item of sorted) if (keep.length < capacity) keep.push(item); else removed.push(item);
  return { targets: keep, removed, simplified: true };
}

function targetHand(target) { return target.hands?.includes('R') ? 'R' : 'L'; }

export function allocate(inputTargets, previous = new Map(), locks = new Map()) {
  const simplified = simplifyTargets(inputTargets);
  const byCode = new Map();
  const targets = new Map();
  for (const [code, note] of locks) {
    const key = KEYS.find(item => item.code === code);
    if (key) byCode.set(code, { ...key, note });
  }
  for (const target of simplified.targets) {
    const binding = [...byCode.values()].find(item => item.note === target.note);
    if (binding) targets.set(target.note, binding);
  }
  let blocked = Boolean(simplified.blocked);
  for (const hand of ['L', 'R']) {
    let wanted = simplified.targets.filter(target => !targets.has(target.note) && targetHand(target) === hand).sort((a, b) => midi(a.note) - midi(b.note));
    const available = KEYS.filter(key => key.hand === hand && !byCode.has(key.code)).sort((a, b) => a.x - b.x);
    if (wanted.length > available.length) {
      const local = simplifyTargets(wanted, available.length);
      wanted = local.targets;
      simplified.removed.push(...local.removed);
      blocked ||= Boolean(local.blocked);
    }
    const cache = new Map();
    const choose = (index, start) => {
      if (index === wanted.length) return { cost: 0, list: [] };
      const id = `${index}:${start}`;
      if (cache.has(id)) return cache.get(id);
      let best = { cost: Infinity, list: [] };
      for (let i = start; i <= available.length - (wanted.length - index); i++) {
        const key = available[i];
        const target = wanted[index];
        const old = [...previous.values()].find(item => item.note === target.note && item.hand === hand);
        let cost = PREFERRED.has(key.label) ? 0 : 5;
        if (old) cost += old.code === key.code ? -4 : 2;
        for (const lock of byCode.values()) {
          if (lock.hand !== hand || lock.note === target.note) continue;
          const pitchDirection = Math.sign(midi(target.note) - midi(lock.note));
          const keyDirection = Math.sign(key.x - lock.x);
          if (pitchDirection && pitchDirection !== keyDirection) cost += 30;
        }
        const tail = choose(index + 1, i + 1);
        if (cost + tail.cost < best.cost) best = { cost: cost + tail.cost, list: [{ ...key, note: target.note }, ...tail.list] };
      }
      cache.set(id, best);
      return best;
    };
    const selected = choose(0, 0);
    if (!Number.isFinite(selected.cost)) blocked = true;
    for (const binding of selected.list) {
      byCode.set(binding.code, binding);
      targets.set(binding.note, binding);
    }
  }
  return { byCode, targets, blocked, simplified: simplified.simplified || simplified.removed.length > 0, removed: simplified.removed };
}
