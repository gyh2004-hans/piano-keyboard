# Piano Keyboard Skill v2 Design

Date: 2026-09-22

## Objective

Upgrade the public `piano-keyboard` Skill so another Agent can reliably build or repair the same class of offline desktop piano-practice application without rediscovering product rules from screenshots or inheriting the obsolete 19-key dynamic-mapping model.

The Skill must remain generic. It may encode reusable behavior learned from the current application, but it must not copy commercial scores, user-specific score images, or the current `piano/` delivery folder into the public repository.

## Deliverable boundary

The repository remains a reusable Agent Skill with:

- a concise routing entry point in `SKILL.md`;
- detailed, phase-specific references;
- deterministic score, mapping, and project validators;
- a public-domain example application;
- unit and real-browser behavioral tests;
- packaging and local-install artifacts.

The repository does not become the source repository for the current `piano/` application.

## Product contract

### Keyboard mapping

Use a fixed 35-key chromatic physical layout across the number row, three letter rows, and adjacent punctuation. The layout preserves semitone order and physical left-to-right pitch order.

For each current group:

1. Preserve the original score pitches.
2. Prefer the smallest whole-layout octave shift that covers the group.
3. If a two-hand group cannot fit one shared octave bank, allocate left and right hands independently while preserving each hand's internal intervals and the familiar physical layout.
4. Lock every held physical key to its sounding pitch until release.
5. Use explicitly reported supplemental keys only for rare groups that still cannot be represented, such as three simultaneous instances of the same pitch class across three octaves.
6. Never silently fold octaves, remove melody, or mutate source score data.

Every previewed group must be allocated from the mapping state expected at that future onset, including held-note locks and announced octave changes.

### Practice timing

- A chord succeeds only when every target pitch is newly armed and held within 120ms of the first correct chord key.
- An incomplete or expired chord remains at the judgment line until the whole attempt is released and retried.
- A wrong note sounds and is counted, but does not satisfy the target group.
- Long notes judge onset only. After a correct onset, releasing immediately or late does not reduce accuracy, pause score time, create a countdown, or require a compensating re-press.
- Repeated pitches require a physical release and a new attack.
- Automatic accompaniment follows the gated score clock and cannot run ahead of an unresolved required onset.

### Prompt identity

The note-flow lane is the canonical source of visible performance characters. The middle computer keyboard must highlight exactly the current flow group's generated character set.

This invariant applies separately to practice and demonstration:

- In practice, sustained notes retained for mapping or audio must not become extra current targets.
- In melody-plus-automatic-accompaniment demonstration, accompaniment may sound but must not create extra middle-keyboard highlights.
- Every render clears stale target and demonstration classes before applying the current canonical set.

Pitch-reference piano highlighting may continue to use exact MIDI pitch. Character keyboard highlighting must use the canonical character bindings, not a second pitch-derived calculation.

### Interface

The primary desktop composition is:

1. continuous right-to-left note flow with a fixed judgment line;
2. four-row computer keyboard with high-contrast current targets;
3. 61-key piano reference.

The song rail has a fixed viewport showing six ordinary cards and uses non-circular vertical wheel scrolling. Preserve score viewer, hand modes, bar range, speed, pause, reset, loop, statistics, demonstration, volume, and source-score integrity.

The primary visual acceptance target is 2560x1440 at 16:9. Also check narrower desktop and mobile-width overflow without claiming mobile feature support.

## Skill information architecture

`SKILL.md` stays concise and routes work by phase:

- recognition and uncertainty handling;
- schema normalization and validation;
- application generation or repair;
- final quality verification.

Detailed requirements live in focused references:

- `references/keyboard-mapping.md`: exact 35-key table, allocation priority, locks, dual hand banks, supplemental keys, and preview simulation;
- `references/practice-engine.md`: state machine, chord retry, free long-note release, accompaniment clock, lifecycle, and scoring;
- `references/interface-design.md`: three-layer central composition, six-card rail, target states, contrast, accessibility, and responsive checks;
- `references/prompt-consistency.md`: canonical prompt data flow for practice and demonstration, failure examples, DOM invariants, and diagnostic procedure;
- `references/quality-checklist.md`: required engine and browser evidence;
- existing recognition, schema, audio, and product references updated only where the new behavior affects them.

The entry point links each reference at the phase where it is required. Instructions do not duplicate whole reference sections.

## Scripts and example application

The mapping library and analyzer must implement and report the 35-key model. Reports include allocation mode, octave shift per hand, locked bindings, supplemental bindings, and blocked groups.

The generated example application uses only public-domain or synthetic score data. It demonstrates:

- normal single-bank mapping;
- dual-hand octave banks;
- a sustained note overlapping a later onset without extra target highlighting;
- melody with automatic accompaniment;
- demonstration prompt identity;
- free long-note release;
- repeated-note re-attack;
- 61-key reference and four-row character keyboard.

Project validation rejects remote runtime dependencies and missing required runtime assets. It also checks structural markers for the four keyboard rows, flow lane, and piano reference without requiring a particular branding style.

## Testing strategy

### Unit tests

- exactly 35 standard performance codes in chromatic order;
- deterministic shared octave allocation;
- independent left/right octave allocation for wide groups;
- held-key pitch locks;
- explicit supplemental mapping for otherwise impossible groups;
- source score immutability;
- 120ms chord boundary and retry lifecycle;
- immediate long-note release with no time or score penalty;
- repeated-note release and re-press;
- accompaniment gating.

### Browser tests

- four-row keyboard and 61-key piano rendered;
- flow, keyboard, and piano appear in the required vertical order;
- six complete song cards fit the rail viewport and wheel scrolling is non-circular;
- practice current-flow characters exactly equal keyboard target characters;
- demonstration current-flow characters exactly equal keyboard demonstration characters;
- accompaniment voices do not produce extra character highlights;
- sustained prior melody notes do not produce extra target highlights;
- early long-note release advances score time and does not add mistakes;
- pause, reset, modes, range, speed, source score, and demonstration remain functional;
- no page errors and no horizontal overflow at the tested viewports.

### Skill validation

Run repository validation, unit tests, Playwright tests, packaging, and the Codex Skill quick validator. Inspect the packaged artifact to ensure generated files, dependency folders, test output, and commercial score assets are excluded.

## Versioning and delivery

Set the package version to `2.0.0` for the behaviorally incompatible mapping upgrade. Update user-facing README material so the advertised layout and behavior match the Skill.

After all checks pass:

1. generate the distributable Skill package;
2. synchronize the repository version into the installed `C:\Users\24939\.agents\skills\piano-keyboard` directory;
3. validate the installed copy;
4. commit the coordinated repository update;
5. push the branch to `origin`.

Do not modify or package the current application directory as part of this repository update.
