export const MODES = ['auto', 'both', 'right', 'left', 'demo', 'free'];
const EPSILON = 1e-7;

export function makeClock(score, speed = 1) {
  const barTicks = score.timeSignature[0] * score.ticksPerBeat;
  const tempos = score.tempoMap.map(item => ({ position: (item.bar - 1) * barTicks + item.tick, bpm: item.bpm })).sort((a, b) => a.position - b.position);
  if (tempos[0]?.position !== 0) tempos.unshift({ position: 0, bpm: tempos[0]?.bpm || 120 });
  return {
    at(position) {
      let seconds = 0;
      for (let i = 0; i < tempos.length; i++) {
        const start = tempos[i].position;
        if (position <= start) break;
        const stop = Math.min(position, tempos[i + 1]?.position ?? position);
        seconds += Math.max(0, stop - start) * 60 / (tempos[i].bpm * score.ticksPerBeat * speed);
        if (stop === position) break;
      }
      return seconds;
    }
  };
}

function userHands(mode) {
  if (mode === 'auto' || mode === 'right') return ['R'];
  if (mode === 'left') return ['L'];
  if (mode === 'both' || mode === 'demo') return ['L', 'R'];
  return [];
}

export class PracticeModel {
  constructor(score, options = {}) {
    this.score = score;
    this.options = { mode: 'auto', speed: 1, loop: false, ...options };
    if (!MODES.includes(this.options.mode)) throw new TypeError(`Unknown mode: ${this.options.mode}`);
    this.reset();
  }
  reset() {
    this.clock = makeClock(this.score, this.options.speed);
    const barTicks = this.score.timeSignature[0] * this.score.ticksPerBeat;
    this.end = this.clock.at(this.score.bars * barTicks);
    const groups = new Map();
    const hands = userHands(this.options.mode);
    for (const event of this.score.events.filter(item => hands.includes(item.hand))) {
      const position = (event.bar - 1) * barTicks + event.tick;
      if (!groups.has(position)) groups.set(position, { position, bar: event.bar, tick: event.tick, time: this.clock.at(position), targets: [] });
      const group = groups.get(position);
      for (const note of event.notes) {
        const old = group.targets.find(item => item.note === note);
        const end = this.clock.at(position + event.duration);
        if (old) { old.end = Math.max(old.end, end); if (!old.hands.includes(event.hand)) old.hands.push(event.hand); }
        else group.targets.push({ note, hands: [event.hand], role: event.hand === 'R' ? 'melody' : 'accompaniment', start: group.time, end });
      }
    }
    this.steps = [...groups.values()].sort((a, b) => a.position - b.position);
    this.backing = this.options.mode === 'auto' ? this.score.events.filter(item => item.hand === 'L').map(event => ({ ...event, time: this.clock.at((event.bar - 1) * barTicks + event.tick) })) : [];
    this.index = 0; this.time = 0; this.backingIndex = 0; this.held = new Set(); this.armed = new Set(); this.active = new Map(); this.paused = true; this.rounds = 0;
    this.chordStartedAt = null; this.chordExpired = false; this.correctGroups = 0;
    this.attempts = 0; this.correctNotes = 0; this.mistakes = 0;
  }
  get current() { return this.steps[this.index]; }
  get complete() { return !this.options.loop && this.index >= this.steps.length && this.time >= this.end - EPSILON; }
  get waiting() { return Boolean(this.current && this.time >= this.current.time - EPSILON); }
  get required() { return this.current?.targets || []; }
  get mappingTargets() { return [...this.active.values(), ...(this.current?.targets || [])].filter((item, index, all) => all.findIndex(x => x.note === item.note) === index); }
  get accuracy() { return this.attempts ? Math.round(100 * this.correctNotes / this.attempts) : null; }
  resume() { if (!this.complete) this.paused = false; }
  pause() { this.paused = true; this.releaseAll(); }
  resetChord() { this.armed.clear(); this.chordStartedAt = null; this.chordExpired = false; }
  releaseAll() { this.held.clear(); this.resetChord(); }
  release(note) {
    this.held.delete(note);
    this.armed.delete(note);
    if (!(this.current?.targets || []).some(target => this.held.has(target.note))) this.resetChord();
  }
  press(note, inputTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000) {
    if (this.options.mode === 'free') { this.held.add(note); return 'free'; }
    if (this.paused || this.complete || this.held.has(note)) return 'ignored';
    const onset = this.waiting && this.current.targets.some(target => target.note === note);
    const sustain = this.active.has(note);
    if (!onset && !sustain && !this.waiting) return 'early';
    this.held.add(note);
    this.attempts++;
    if (!onset && !sustain) { this.mistakes++; return 'wrong'; }
    if (onset) {
      if (this.chordStartedAt === null) this.chordStartedAt = inputTime;
      if (this.chordExpired || inputTime - this.chordStartedAt > .12 + EPSILON) {
        this.chordExpired = true;
        this.armed.clear();
        this.mistakes++;
        return 'late';
      }
      this.armed.add(note);
    }
    this.correctNotes++;
    return this.accept() ? 'correct' : 'partial';
  }
  accept() {
    if (!this.waiting || this.chordExpired || !this.current.targets.every(target => this.held.has(target.note) && this.armed.has(target.note))) return false;
    for (const target of this.current.targets) {
      const old = this.active.get(target.note);
      this.active.set(target.note, { ...target, end: Math.max(target.end, old?.end || 0) });
    }
    this.index++; this.correctGroups++; this.resetChord(); return true;
  }
  update(delta) {
    if (this.paused || this.complete || this.options.mode === 'free') return [];
    this.accept();
    if (this.waiting) return [];
    const limit = this.current?.time ?? this.end;
    this.time = Math.min(this.time + Math.max(0, delta), limit, this.end);
    for (const [note, target] of this.active) if (target.end <= this.time + EPSILON) this.active.delete(note);
    const sounds = [];
    while (this.backingIndex < this.backing.length && this.backing[this.backingIndex].time <= this.time + EPSILON) sounds.push(this.backing[this.backingIndex++]);
    if (this.options.loop && this.index >= this.steps.length && this.time >= this.end - EPSILON) { this.rounds++; this.reset(); this.paused = false; }
    return sounds;
  }
}
