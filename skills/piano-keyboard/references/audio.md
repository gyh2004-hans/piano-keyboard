# Audio

## Required source and player

Use **Salamander Grand Piano v3**, Alexander Holm (Yamaha C5), from the Skill's
`assets/salamander/upstream/`. Source revision:
`3382bf9496bba2486f5ab0de55a264d1dfc38404` in
https://github.com/sfzinstruments/SalamanderGrandPiano .
The library is CC BY 3.0, independent of the Skill's MIT code license.
Copy attribution and the full audio license into every delivery.

All 641 FLAC recordings are retained unchanged: 48 kHz, 24-bit, stereo, full tails.
There are 30 recorded pitch centers × 16 velocity layers, mapped to 88 piano notes
A0–C8 according to upstream regions. This is not 88 separately recorded keys.
161 auxiliary samples (resonance, hammer release and pedal) are also retained.
Do not remove layers or use lossy conversion unless the user changes this requirement.

The canonical player is `assets/audio/salamander-audio.js`. Models must reuse it
rather than independently write oscillator synthesis or pick another font.
This gives consistent source timbre and articulation; devices and browsers can
still affect final output. It is a project reference sound, not a universal standard.

## Bundled installation

The complete pinned audio library is downloaded together with the Skill (about
714 MiB). Installation includes all 641 recordings, upstream mapping and license,
player, loading UI, inventory and checksums. No additional audio download is needed
to generate an app. Tests, showcase documentation and generated apps are excluded.
`node scripts/collect_salamander.mjs` is a maintenance/recovery tool for missing or
corrupt files; normal installation and generation use the bundled recordings.

## Assemble a generated app

From the installed Skill directory:

```powershell
node scripts/validate_audio.mjs
node scripts/export_audio.mjs path/to/generated-app
node scripts/validate_project.mjs path/to/generated-app
```

Export produces `audio/salamander-audio.js`, `audio/samples/*.flac.js`,
`audio/manifest.json`, `audio/ATTRIBUTION.md` and `audio/LICENSE-Salamander.txt`.
Each sample wrapper contains original FLAC bytes as Base64 without re-encoding.
Classic script tags load them under `file://` without local fetch, a server, CDN
or runtime network. Base64 raises the payload from about 714 MiB to 952 MiB.
Never read these large wrappers into an Agent context; use the tools.

```html
<script src="audio/salamander-audio.js"></script>
<link rel="stylesheet" href="audio/audio-loading.css">
<script src="audio/audio-loading.js"></script>
<script src="app.js"></script>
```

```javascript
const audio = new SalamanderAudio({ volume: 0.65 });
// In a user gesture, finish loading before enabling input or starting the clock.
await audio.preload(['C4', 'E4', 'G4'], { velocity: 80 });
const when = audio.context.currentTime + 0.01;
const manual = audio.play('C4', { id: 'manual-KeyQ', velocity: 80, when });
audio.play('C4', { id: 'backing-event-1', velocity: 80, when, duration: 1 });
audio.release(manual); // Only this voice; backing continues.
audio.setPedal(true);
audio.setPedal(false);
audio.setVolume(0.5);
audio.stopAll();
```

Default velocity is MIDI 80, default tuning is upstream Retuned. `tuning:'natural'`
keeps uncorrected recordings. Velocity is an integer 1–127; handle velocity 0
as note-off outside this API. Upstream layer boundaries are
26,34,36,43,46,50,56,64,72,80,88,96,104,112,120,127, not equal divisions.
Never infer playing velocity from computer-key hold duration. Preload all score,
wrong-note, free-play and accompaniment pitches at their actual velocities.
Use `preload(notes,{velocities:[...]})` before passages with changing dynamics.

`play()` is synchronous after preload and returns an owned voice; it throws if
its sample is missing. `when` and `duration` are AudioContext seconds.
`release(voice)` or `release(id)` affects one voice. `stopAll()` cancels current
and future voices and resets sustain. Show clear errors for audio startup,
missing files and unsupported FLAC decoding. Never silently fall back to synthesis.


## Loading feedback

Include the exported `audio/audio-loading.js` and `audio/audio-loading.css` for
first-load feedback. The shared modal follows the warm paper / green palette,
shows decoded sample count and percentage, supports narrow screens and reduced
motion, and restores focus when closed. Adapt its visual styling to the target
app while keeping its progress semantics. It has no network dependencies.

`preload()` reports `{state,completed,total,error}` through the optional
constructor callback `onLoadProgress` and the modal. Count unique samples for
the requested pitches and velocities, including cached samples; increment only
after decoding. A full 88-note preload at velocity 80 needs 30 recordings, not
641. Never fake progress or claim the entire archive is loaded into memory.
Already cached passages do not reopen the modal. Completion closes it; failures
remain visible and a later preload can reuse successful buffers. “收起” and Escape
hide the modal while loading continues; they do not cancel pending playback.
Keep the app's existing startup cancellation / generation guards.

Verify partial progress, automatic close, background loading after dismissal,
error and retry, keyboard focus, and desktop / mobile bounds in the browser.

## Memory and boundaries

The player loads four files concurrently and caches decoded buffers with a
256 MiB LRU target. A preloaded passage's protected working set may exceed this
target so it stays playable; active voices retain buffers until ending.
Do not preload all 480 attacks on page load: that can occupy multiple GiB.
Load bounded passages and velocity sets before playback, refill between passages.
All full-quality files stay available locally regardless of current cache.

The player implements exact attack-layer selection, pitch regions, Retuned
correction, volume, per-voice damping and sustain-pedal release.
It is **not** an SFZ/ARIA engine: auxiliary resonance, mechanical/pedal noises,
ARIA curves, half-pedaling and offset controllers are not rendered currently.
Keep all upstream SFZ/Data and auxiliary recordings for future extensions.
Do not claim equivalence to the upstream sforzando demo.

## Practice synchronization

Unlock Web Audio after a user gesture. Finish preload before accepting onsets;
loading must not shift playback or widen the 120ms chord acceptance window.

Route manual notes, wrong notes, automatic accompaniment, demonstration, free play, volume, release, and stop-all through one audio service. Scoring decides whether a note advances the exercise; it must not suppress a playable wrong note.

Physical keyup stops only that manual voice. Long-note score lifecycle remains active until written end, but this does not force sound or holding. Scheduled accompaniment/demo voices use unique IDs so releasing a same-pitch manual key cannot stop them.

On pause, reset, mode/song/range change, blur, visibility loss, and unload, cancel scheduled timers and release all owned voices.

Invalidate pending startup/play promises so an old load cannot restart sound after
reset. Oscillators are allowed for a separate metronome, never for piano timbre.

## Automatic accompaniment and demonstration

Automatic accompaniment shares the score clock and waits behind unresolved user onsets. Its audio-event list is separate from the canonical visible prompt. Demonstration may schedule both hands while the visible prompt contains only the selected melody targets.

Instrument this separation in tests: expose or record a nonzero accompaniment scheduling count, then assert visible flow and keyboard target sets remain equal.

## Audition and verification

Run `npm run audio:preview`, then open `dist/audio-preview/index.html` for low,
middle and high notes, changing velocity and chords. The preview source is
`examples/audio-preview/index.html`. Use a recent FLAC-capable desktop browser.
Browser tests must prove file:// decoding and nonzero rendered audio, not just
count calls to play().
