# Audio and metronome

## Piano synthesis

Use Web Audio after a user gesture. Create one voice per note with a short attack, gentle decay, and smooth release. Use compact local synthesis by default; do not fetch samples at runtime.

One audio service handles manual notes, accompaniment, demonstration, free play, metronome ticks, volume, note release, and stop-all.

## Independent metronome

The metronome never changes mapping, correctness, or score gating. Provide BPM and meter display; score, 0.5×, 0.75×, and custom speeds; a distinct first beat; optional tempo-map following; and a pendulum disabled by `prefers-reduced-motion` while audio and beat text remain active. Clear timers when stopped or unloaded.
