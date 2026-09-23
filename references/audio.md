# Audio

## Piano synthesis

Unlock Web Audio after a user gesture. Use one cancellable voice per physical input or scheduled event, with a short attack, gentle decay, and click-free release. Use compact local synthesis by default; never fetch samples at runtime.

Route manual notes, wrong notes, automatic accompaniment, demonstration, free play, volume, release, and stop-all through one audio service. Scoring decides whether a note advances the exercise; it must not suppress a playable wrong note.

Physical keyup stops only that manual voice. Long-note score lifecycle remains active until written end, but this does not force sound or holding. Scheduled accompaniment/demo voices use unique IDs so releasing a same-pitch manual key cannot stop them.

On pause, reset, mode/song/range change, blur, visibility loss, and unload, cancel scheduled timers and release all owned voices.

## Automatic accompaniment and demonstration

Automatic accompaniment shares the score clock and waits behind unresolved user onsets. Its audio-event list is separate from the canonical visible prompt. Demonstration may schedule both hands while the visible prompt contains only the selected melody targets.

Instrument this separation in tests: expose or record a nonzero accompaniment scheduling count, then assert visible flow and keyboard target sets remain equal.
