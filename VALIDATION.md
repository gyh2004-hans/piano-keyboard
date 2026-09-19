# Validation record

Date: 2026-09-19  
Environment: Windows, Node.js 22.22.2, Microsoft Edge through Playwright

## Results

| Check | Command | Result |
|---|---|---|
| Score, project, and unit validation | `npm run validate` | Passed: valid score, valid offline project, 22 tests |
| Desktop browser behavior | `npm run test:browser -- --reporter=line` | Passed: 2 Playwright scenarios |
| Agent Skill structure | `python .../skill-creator/scripts/quick_validate.py .` | Passed: `Skill is valid!` |

The automated checks cover score errors and uncertainty gating, normalization and range-entry continuations, the Q–P/A–L key set, ordered ergonomic mapping, held-key locks, over-capacity simplification, chord gating, free early release, rests, repeated notes, tempo changes, six modes, automatic demonstration, automatic accompaniment starts, free-play mapping, accompaniment waiting, pause cleanup, offline assets, stable prompt geometry, letter-only previews, 19 computer keys, 61 piano keys, and the independent metronome.

## Reproduce

```powershell
npm install --cache .npm-cache
npm run validate
npm run test:browser -- --reporter=line
python C:/Users/24939/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

On a clean machine without a Playwright browser, run `npx playwright install chromium` before the browser test.
