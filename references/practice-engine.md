# Practice engine state machine

## State

Keep these values explicit and testable:

- `time`, `index`, `current`, `paused`, `complete`, `waiting`;
- `held`: physically depressed pitches/codes;
- `armed`: correct notes newly pressed for the current onset;
- `active`: accepted score notes whose written end time has not passed;
- `chordStartedAt`, `chordExpired`;
- `attempts`, `correctNotes`, `correctGroups`, `mistakes`, `accuracy`;
- `backingIndex` for automatic accompaniment.

`active` describes score lifecycle, not what the player must continue holding. Do not build the next visible prompt from `active`.

## Press transition

Use a monotonic input timestamp in seconds.

```js
press(note, inputTime) {
  if (paused || complete || held.has(note)) return 'ignored';
  const onset = waiting && current.targets.some(target => target.note === note);
  const sustain = active.has(note);
  if (!onset && !sustain && !waiting) return 'early';

  held.add(note);
  attempts++;
  if (!onset && !sustain) {
    mistakes++;
    return 'wrong'; // caller still plays the note
  }

  if (onset) {
    if (chordStartedAt === null) chordStartedAt = inputTime;
    if (chordExpired || inputTime - chordStartedAt > 0.12 + EPSILON) {
      chordExpired = true;
      armed.clear();
      mistakes++;
      return 'late';
    }
    armed.add(note);
  }
  correctNotes++;
  return accept() ? 'correct' : 'partial';
}
```

The 120ms boundary is inclusive: `0.1200000` passes; `0.1200001` fails after epsilon handling. A late chord stays unresolved. Require the user to release all current-target keys before `resetChord()` enables a retry.

Wrong notes must reach the audio service before or alongside scoring. They count as attempts/mistakes but never enter `armed` and never advance `index`.

## Acceptance and long notes

Accept only when every current target is both held and armed inside the window. On acceptance:

1. merge each target into `active`, retaining the latest written `end` for overlapping same-pitch notes;
2. increment `index` and `correctGroups`;
3. clear chord timing/armed state;
4. release the score clock gate.

Keyup stops that physical voice and removes it from `held`/`armed`. It must not remove the accepted target from `active`, reduce accuracy, add a mistake, pause time, or wait for the written end. `update(delta)` removes `active` entries only when score time reaches their written end.

This is onset-only long-note judgment. Do not add a hidden minimum hold duration, ±0.5-second release score, tail countdown, or early-release penalty.

## Repeated notes, rests, and accompaniment

- A repeated pitch while its physical key is still held returns `ignored`; keyup followed by a new keydown is required.
- Rests advance naturally with the score clock.
- In automatic accompaniment mode, the user gate contains melody/right-hand targets only. Accompaniment uses the same score clock and starts only after the corresponding melody gate clears.
- Demonstration and free play do not contribute to practice accuracy.

## Lifecycle cleanup

On pause, restart, song/range/hand-mode change, window blur, or document hiding:

- stop every manual, accompaniment, demo, and metronome voice/timer owned by the changing session;
- clear `held`, `armed`, and chord timing;
- rebuild allocation locks;
- preserve or reset `active`, counters, and score time according to the named action (pause preserves position; reset/song/range change resets it).

Test pause and resume separately from reset. A pause must never leave a phantom held key that blocks the next allocation.
