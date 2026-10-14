# PC-first interface design

## Information architecture

At 2560×1440 use a three-column shell:

- left: fixed-height song rail and orientation;
- center: song/status, progress, flow lane, four-row keyboard, 61-key piano, then statistics;
- right: hand/mode/range/speed controls, pause/reset/demo, and concise guidance.

Brand colors and background may vary. Preserve the center order and make it visually dominant. The flow lane occupies the upper center, keyboard highlighting stays directly beneath it, and the piano anchors the bottom.

## Flow lane

Use a clipped, fixed-height lane with a high-contrast judgment line. Current and future groups move toward the line; chords stack characters vertically. Current characters may be larger, but do not add persistent pitch names or instructional prose inside the lane. A rest may use a short textual state outside the character stack.

Motion must use `transform`/position interpolation without changing surrounding layout. Under `prefers-reduced-motion`, remove travel animation while preserving current/future order and all status text.

## Four-row keyboard

Render `1234567890-=`, `QWERTYUIOP[]`, `ASDFGHJKL;'`, and `ZXCVBNM,./`. Keep the light-green keycap language when it fits the product, but ensure text and target colors meet strong contrast. Distinguish target, matched/down, left-hand target, supplemental, inactive, and locked states with borders/text/icons as well as color.

The 35 standard keys are the stable chromatic performance set. Supplemental and inactive physical keys remain visible so the on-screen keyboard matches the user's PC keyboard.

## 61-key piano and song rail

Render 61 piano keys from C2 through C7 directly below the computer keyboard. The piano may show sounding/target pitch state but must not become the source of flow letters.

The song rail has a fixed viewport that shows exactly six complete cards at the primary desktop size. Native wheel/trackpad scrolling moves vertically, stops at the first/last item, and never wraps. Do not auto-advance or carousel-loop the list.

## Responsive and accessibility checks

- Primary acceptance: 2560×1440, 16:9.
- Also verify 1920, 1366, and 390 CSS-pixel widths.
- No document-level horizontal overflow; a component-local piano scroller is allowed only if the product explicitly chooses it.
- Use semantic buttons/labels, visible focus, readable status text, and non-color cues.
- Keep backgrounds and letters strongly contrasted; do not inherit low-contrast styling from a reference site.
- Do not claim mobile playability unless touch interaction, audio unlock, layout, and latency are separately tested.
