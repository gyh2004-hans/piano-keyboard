<p align="center"><img src="docs/assets/hero.svg" alt="Piano Keyboard: from score to offline piano practice" width="100%"></p>

<p align="center"><strong>Turn a score into a playable, testable, fully offline piano-practice page.</strong></p>
<p align="center"><a href="README.md">简体中文</a> · <strong>English</strong></p>

## Quick start

```bash
npx skills add gyh2004-hans/piano-keyboard
```

Give your Agent score images or a PDF and invoke `$piano-keyboard`. The Skill guides score confirmation, data modeling, key allocation, offline implementation, and acceptance checks.

<p align="center"><img src="docs/assets/piano-keyboard-demo.gif" alt="Public-domain 2D reference app with note flow, keyboard highlights, and a 61-key piano" width="100%"></p>

## What it covers

| From score to performance | Delivery standard |
|:---|:---|
| Recognition | Inventory every page and confirm uncertain notes and rhythms |
| Mapping and practice | 35-key chromatic layout, automatic octave banks, note flow, and a 61-key piano |
| Sound and progress | Local synthesis, accompaniment, chords, and long-note judgment |
| Offline acceptance | Data, mapping, state-machine, and real-browser checks |

The [reference app](examples/generated-app) demonstrates 2D practice behavior. It is not a product template to copy wholesale.

## Optional 3D performance room

When a user requests 3D piano, follow the [3D extension specification](references/3d-piano.md):

- All 61 keys share the 2D page's 35-key mapping; ivory and obsidian are the two finishes.
- The warm-brown stage starts with ambient lighting off; its control adjusts backdrop and scene lights together.
- Red-to-violet trails span all keys, grow vertically while held, and rise at their final length after release.

The extension stays offline and preserves 2D practice progress.

## Install and update

| Purpose | Command |
|:---|:---|
| Update the current installation | `npx skills update piano-keyboard` |
| Install globally for Codex on Windows (copy mode) | `npx skills add gyh2004-hans/piano-keyboard --skill piano-keyboard --agent codex --global --copy --yes` |
| Update a global installation | `npx skills update piano-keyboard -g -y` |

See the [Skills CLI documentation](https://skills.sh/docs/cli) for all options.

## Workflow and verification

1. Inventory the original score and confirm ambiguous readings.
2. Normalize a copy; preserve source pitches and analyze shared, independent-hand, and supplemental mappings.
3. Build local HTML, CSS, JavaScript, and Web Audio; keep prompts, highlights, sound, and practice progress aligned.
4. Check interaction, audio, pause/reset, and offline `file://` loading in a desktop browser.

```powershell
npm ci
npm run validate
npm run test:browser -- --reporter=line
node scripts/validate_project.mjs path/to/generated-app
```

Start with [SKILL.md](SKILL.md); see [references/](references/) for details and [schemas/](schemas/) for score data. This repository contains the reusable Skill, tools, and public-domain examples—not a user's commercial score or the finished app from another workspace.

Code and documentation use the [MIT License](LICENSE). Rights to third-party scores require separate confirmation.
