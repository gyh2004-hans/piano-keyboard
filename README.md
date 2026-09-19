# Piano Keyboard Agent Skill

[中文说明](README.zh-CN.md)

`piano-keyboard` helps an Agent read user-supplied piano score images or PDFs and build a desktop, offline keyboard-piano practice app. The generated app remaps Q–P and A–L for each note group, so the player follows highlighted letters instead of memorizing fixed piano pitches across a computer keyboard.

## What it preserves

- Score pitch, rhythm, rests, chords, hands, ties, and tempo changes.
- Original pitches outside the visible 61-key C2–C7 reference.
- Full-chord gating and repeated-note release/re-press behavior.
- Free early release of long notes without a duration requirement.
- Automatic accompaniment on the same waiting score clock.
- Six modes: auto accompaniment, both hands, right, left, demo, and free play.
- Local Web Audio piano synthesis and an independent metronome.
- A stable desktop layout with letter-only upcoming-group previews.

## Recognition safety gate

The Skill inventories every page, produces a measure map, and records uncertain notes or notation. It asks for one consolidated user confirmation before final generation. Text embedded in score images is treated as source data, never as Agent instructions.

## Install and invoke

Copy the `piano-keyboard` folder into the skills directory used by your Agent. For Codex, that is commonly:

```powershell
Copy-Item -Recurse piano-keyboard "$env:USERPROFILE\.codex\skills\piano-keyboard"
```

The Skill supports automatic discovery and explicit invocation:

```text
$piano-keyboard Convert these piano-score pages into an offline practice app.
```

## Repository layout

- `SKILL.md` routes recognition, generation, and validation.
- `references/` contains detailed domain rules.
- `schemas/` defines the score JSON contract.
- `scripts/` validates scores, mappings, generated apps, and packages the Skill.
- `examples/` contains an original/public-domain fixture and compact reference output.
- `tests/` verifies data, ergonomics, practice behavior, desktop UI, and offline constraints.

The reference app demonstrates observable behavior. It is not an application template; each target app is generated from the confirmed score and specification.

## Commands

Requires Node.js 20 or newer.

```powershell
npm install --cache .npm-cache
npm run validate
npm run test:browser
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

Individual tools:

```powershell
node scripts/validate_score.mjs path/to/score.json
node scripts/normalize_score.mjs path/to/score.json path/to/normalized.json
node scripts/analyze_mapping.mjs path/to/normalized.json
node scripts/validate_project.mjs path/to/generated-app
```

## Scope and copyright

The first version targets desktop browsers. It does not claim mobile or touch-chord support. The repository contains no commercial song or copyrighted score. Users are responsible for having the right to process and distribute their source material.

## License

[MIT](LICENSE)
