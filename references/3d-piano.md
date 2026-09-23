# Optional 3D piano extension

Add a 3D performance room only when the user asks for it. Keep the core 2D flow, score, and practice state intact. Use local rendering assets so `index.html` still opens from `file://` without a server or runtime network request. Build original geometry and materials; do not copy a reference site's branded model or audio samples.

## Interaction and sound

- Render 61 separately playable keys. Mouse and touch raycasts, physical keyboard input, score playback, and practice targets must refer to the same MIDI pitches.
- Reuse the 2D page's 35-key chromatic allocator, including automatic octave banks and held-key locks. Do not introduce a competing 17-key layout or a separate key-setting control.
- Keep 3D audio/input ownership separate from the 2D practice session. On entry pause the 2D session without losing its progress; on exit, blur, pause, or song change, release held notes and scheduled voices.
- Offer ivory and obsidian body finishes. Keep scene controls for camera, piano lid/stand, lighting, and fullscreen without requiring external devices.

## Stage and note trails

- Use a warm brown floor and background. Start with ambient lighting off; the light control changes the backdrop, hemisphere light, key light, and fill light together. A separate spotlight may illuminate the piano while the surroundings stay dark.
- Give every key a color along one continuous red–orange–yellow–green–cyan–blue–violet scale: leftmost red, rightmost violet. Use only note-trail key effects, without unrelated stage particles.
- Anchor a trail at its key while held and grow its vertical length with hold time. On release, freeze that length, move it straight upward without X/Z drift, then fade and dispose it. Repeated presses create separate trails.
- Respect reduced-motion settings and make the stage controls readable in both lighting states.

Verify the `file://` page in a real browser: all 61 colors and endpoints, short versus long holds, release/fade, light on/off, both skins, pointer and keyboard input, audio, 2D state preservation, and a WebGL fallback.
