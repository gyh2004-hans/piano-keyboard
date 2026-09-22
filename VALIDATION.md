# Validation record

Date: 2026-09-22
Environment: Windows, Node.js 22.22.2, Microsoft Edge through Playwright

## Results

| Check | Command | Result |
|---|---|---|
| Score, project, and unit validation | `npm run validate` | Passed: valid public score, valid offline v2 project, 30 tests |
| Desktop browser behavior | `npm run test:browser -- --reporter=line` | Passed: 4 Playwright scenarios |
| Agent Skill structure | `python .../skill-creator/scripts/quick_validate.py .` | Passed: `Skill is valid!` |
| Guarded local installer | `node --test tests/install-local.test.mjs` | Passed: 2 scenarios |

Unit evidence covers score errors and uncertainty gating, immutable normalization, range-entry continuations, the exact 35-key chromatic layout, shared and independent octave banks, held locks, supplemental bindings, blocked-group reporting, inclusive 120ms chords, audible wrong attempts, penalty-free immediate long-note release, repeated-note re-press, rests, tempo changes, six modes, pause cleanup, canonical prompt derivation, offline assets, four keyboard rows, flow lane, and the 61-key declaration.

Browser evidence covers 45 rendered physical keys, 35 standard bindings, 61 piano keys, six fully visible song cards, flow → keyboard → piano ordering, non-looping wheel scrolling, practice and demo prompt-set identity, accompaniment scheduling without extra highlights, immediate release without penalty, and no document horizontal overflow at 2560, 1920, 1366, and 390 CSS-pixel widths.

## Reproduce

```powershell
npm install
npm run validate
npm run test:browser -- --reporter=line
python C:/Users/24939/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
node --test tests/install-local.test.mjs
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

On a clean machine without a Playwright browser, run `npx playwright install chromium` before the browser test.
