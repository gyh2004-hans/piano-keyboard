# Piano Keyboard Skill v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a detailed, test-backed v2 Skill that reliably generates offline piano-practice apps with a 35-key chromatic layout, canonical flow/keyboard prompts, 120ms chords, and penalty-free long-note release.

**Architecture:** Replace the old 19-key per-group ergonomic allocator with a deterministic 35-key chromatic octave-bank allocator shared by analysis and the public example. Keep practice timing, prompt derivation, and rendering as separate modules so browser tests can prove their contracts independently. Keep `SKILL.md` short and route conditional detail into focused references.

**Tech Stack:** Node.js 20+ ESM, JSON Schema, vanilla HTML/CSS/JavaScript, Web Audio, Playwright, PowerShell packaging, Codex Skill validator.

---

## File map

- `SKILL.md`: phase router and mandatory cross-cutting invariants.
- `references/keyboard-mapping.md`: exact 35-key table and allocation procedure.
- `references/practice-engine.md`: onset state machine and lifecycle.
- `references/prompt-consistency.md`: canonical visible-prompt contract and diagnostics.
- `references/interface-design.md`: desktop composition and visual states.
- `references/product-spec.md`, `references/quality-checklist.md`, `README.md`, `README.en.md`: public product contract.
- `scripts/lib/keyboard-mapping.mjs`: deterministic octave-bank allocator.
- `scripts/lib/practice-model.mjs`: score clock, chord gate, release, scoring, and accompaniment.
- `scripts/lib/prompt-state.mjs`: canonical character prompt derivation.
- `scripts/lib/project-check.mjs`: offline and structural validation.
- `examples/generated-app/*`: synthetic/public-domain reference implementation.
- `tests/*.test.mjs`: unit and browser behavioral evidence.
- `scripts/package_skill.ps1`, `scripts/install_local.ps1`: package and verified local installation.

### Task 1: Replace the keyboard mapping contract

**Files:**
- Modify: `tests/keyboard-mapping.test.mjs`
- Modify: `scripts/lib/keyboard-mapping.mjs`
- Modify: `scripts/analyze_mapping.mjs`

- [ ] **Step 1: Write failing 35-key mapping tests**

Replace the 19-key assertion and add shared-bank, dual-bank, lock, and supplemental cases:

```js
import { ALLOWED_LABELS, STANDARD_KEYS, allocate } from '../scripts/lib/keyboard-mapping.mjs';

test('uses the fixed 35-key chromatic layout', () => {
  assert.deepEqual(ALLOWED_LABELS, [..."Q2W3ER5T6Y7UI9O0PZSXDCFVBHNJM,L.;/'"]);
  assert.equal(STANDARD_KEYS.length, 35);
  assert.deepEqual(STANDARD_KEYS.map(key => key.base), Array.from({ length: 35 }, (_, i) => 48 + i));
});

test('moves one shared octave bank without folding intervals', () => {
  const result = allocate([target('C3', 'L'), target('E4'), target('G4')]);
  assert.equal(result.blocked, false);
  assert.equal(result.shifts.L, result.shifts.R);
  assert.equal(midi(result.targets.get('G4').note) - midi(result.targets.get('E4').note), 3);
});

test('uses independent hand banks for a wide two-hand group', () => {
  const result = allocate([target('C2', 'L'), target('G2', 'L'), target('E5'), target('B5')]);
  assert.equal(result.blocked, false);
  assert.equal(result.dual, true);
  assert.notEqual(result.shifts.L, result.shifts.R);
});

test('locks a held physical code to its original pitch', () => {
  const first = allocate([target('C4')]);
  const code = first.targets.get('C4').code;
  const next = allocate([target('C6')], first.byCode, new Map([[code, 'C4']]));
  assert.equal(next.byCode.get(code).note, 'C4');
});

test('reports explicit supplemental bindings for three-octave unisons', () => {
  const result = allocate([target('B3', 'L'), target('B4'), target('B5')]);
  assert.equal(result.blocked, false);
  assert.ok([...result.byCode.values()].some(binding => binding.supplemental));
});
```

- [ ] **Step 2: Run the mapping tests and verify RED**

Run: `node --test tests/keyboard-mapping.test.mjs`

Expected: FAIL because the current module exports 19 dynamic keys and no octave-bank metadata.

- [ ] **Step 3: Implement the fixed chromatic allocator**

Use these exact public constants and return fields:

```js
export const STANDARD_LABELS = [..."Q2W3ER5T6Y7UI9O0PZSXDCFVBHNJM,L.;/'"];
export const SUPPLEMENTAL_LABELS = ['A', 'G', 'K', '1', '4', '8'];
export const STANDARD_KEYS = STANDARD_LABELS.map((label, x) => ({
  label, code: codeFor(label), x, base: 48 + x, hand: x < 17 ? 'L' : 'R'
}));
export const ALLOWED_LABELS = [...STANDARD_LABELS];
```

Port the tested shared-octave candidate search, independent left/right bank fallback, held-code replacement, and supplemental fallback from the current application into ESM. Return:

```js
return { byCode, targets: assigned, blocked, shift, shifts, dual, split, supplemental };
```

Do not simplify or remove score notes in `allocate`; blocked groups remain visible in the analysis report.

- [ ] **Step 4: Expand mapping analysis output**

Add per-group fields for `shift`, `shifts`, `dual`, `split`, `locked`, `supplemental`, and `blocked`. Preserve score immutability by comparing the normalized score JSON before and after analysis.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/keyboard-mapping.test.mjs`

Expected: PASS.

Commit:

```powershell
git add scripts/lib/keyboard-mapping.mjs scripts/analyze_mapping.mjs tests/keyboard-mapping.test.mjs
git commit -m "feat: add fixed 35-key octave mapping"
```

### Task 2: Harden the practice engine contract

**Files:**
- Modify: `tests/practice-engine.test.mjs`
- Modify: `scripts/lib/practice-model.mjs`

- [ ] **Step 1: Write failing chord-window and scoring tests**

Add deterministic input timestamps and assertions:

```js
test('accepts a chord at 120ms and rejects it after the boundary', () => {
  const accepted = new PracticeModel(score, { mode: 'right' });
  accepted.resume();
  assert.equal(accepted.press('C4', 1), 'partial');
  assert.equal(accepted.press('E4', 1.12), 'correct');

  const late = new PracticeModel(score, { mode: 'right' });
  late.resume();
  late.press('C4', 1);
  assert.equal(late.press('E4', 1.121), 'late');
  assert.equal(late.index, 0);
});

test('free long-note release never pauses or reduces accuracy', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume(); model.press('C4', 0); model.press('E4', .05);
  model.release('C4'); model.release('E4'); model.update(2);
  assert.equal(model.time, 2);
  assert.equal(model.mistakes, 0);
  assert.equal(model.accuracy, 100);
});

test('wrong notes sound as attempts but do not satisfy the onset', () => {
  const model = new PracticeModel(score, { mode: 'right' });
  model.resume();
  assert.equal(model.press('D4', 0), 'wrong');
  assert.equal(model.index, 0);
  assert.equal(model.mistakes, 1);
});
```

- [ ] **Step 2: Run practice tests and verify RED**

Run: `node --test tests/practice-engine.test.mjs`

Expected: FAIL because the current model has no 120ms timer, chord expiry, or scoring counters.

- [ ] **Step 3: Implement the onset state machine**

Add `chordStartedAt`, `chordExpired`, `attempts`, `correctNotes`, `correctGroups`, `mistakes`, and `accuracy`. `press(note, inputTime)` must:

```js
if (onset) {
  if (this.chordStartedAt === null) this.chordStartedAt = inputTime;
  if (this.chordExpired || inputTime - this.chordStartedAt > .12 + EPSILON) {
    this.chordExpired = true;
    this.armed.clear();
    this.mistakes++;
    return 'late';
  }
  this.armed.add(note);
}
```

`release` resets an incomplete chord only after no current target remains held. Accepted long notes stay in `active` until score time reaches `end`, but missing physical holds never gate `update(delta)` and never affect accuracy.

- [ ] **Step 4: Run tests and commit**

Run: `node --test tests/practice-engine.test.mjs`

Expected: PASS.

Commit:

```powershell
git add scripts/lib/practice-model.mjs tests/practice-engine.test.mjs
git commit -m "feat: enforce chord onset timing and free release"
```

### Task 3: Add a canonical prompt-state module

**Files:**
- Create: `scripts/lib/prompt-state.mjs`
- Create: `tests/prompt-state.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write prompt identity tests**

```js
import { canonicalPrompt, applyPromptClasses } from '../scripts/lib/prompt-state.mjs';

test('practice prompt excludes sustained prior notes', () => {
  const step = { targets: [{ note: 'E4' }, { note: 'B4' }] };
  const allocation = { targets: new Map([['E4', { label: 'P' }], ['B4', { label: 'V' }]]) };
  assert.deepEqual(canonicalPrompt(step, allocation).map(item => item.label), ['P', 'V']);
});

test('demo prompt excludes accompaniment-only voices', () => {
  const step = { targets: [{ note: 'C4' }] };
  const allocation = { targets: new Map([['C4', { label: 'B' }], ['C3', { label: '6' }]]) };
  assert.deepEqual(canonicalPrompt(step, allocation).map(item => item.label), ['B']);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/prompt-state.test.mjs`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement one canonical character set**

```js
export function canonicalPrompt(step, allocation) {
  return (step?.targets || []).map(target => ({
    target,
    binding: allocation.targets.get(target.note),
    label: allocation.targets.get(target.note)?.label || '鼠标'
  }));
}

export function applyPromptClasses(elements, prompt, className) {
  const labels = new Set(prompt.map(item => item.label.toUpperCase()));
  for (const element of elements) {
    element.classList.remove('target', 'target-left', 'matched', 'demo-note');
    const label = element.querySelector('strong')?.textContent.toUpperCase();
    element.classList.toggle(className, labels.has(label));
  }
}
```

Both the flow renderer and computer-keyboard renderer consume the same returned array. Audio event selection remains separate.

- [ ] **Step 4: Add the test to `npm test`, run, and commit**

Update the `test` script to include `tests/prompt-state.test.mjs`.

Run: `npm test`

Expected: PASS.

Commit:

```powershell
git add scripts/lib/prompt-state.mjs tests/prompt-state.test.mjs package.json
git commit -m "feat: unify visible piano prompts"
```

### Task 4: Rebuild the public reference application

**Files:**
- Modify: `examples/generated-app/index.html`
- Modify: `examples/generated-app/styles.css`
- Modify: `examples/generated-app/app.js`
- Modify: `examples/generated-app/score.js`

- [ ] **Step 1: Replace the center composition**

Use stable semantic containers in this order:

```html
<div id="noteFlow" class="note-flow" aria-label="音符流水线">
  <div class="flow-line" aria-hidden="true"></div>
  <div class="flow-notes"></div>
</div>
<div id="computerKeyboard" class="computer-keyboard" aria-label="四排电脑键盘"></div>
<div id="piano61" class="piano61" aria-label="61 键钢琴"></div>
```

Render rows `1234567890-=`, `QWERTYUIOP[]`, `ASDFGHJKL;'`, and `ZXCVBNM,./`, while only the 35 standard and explicit supplemental bindings are playable.

- [ ] **Step 2: Implement flow and keyboard rendering from one prompt**

In every practice or demo render:

```js
const prompt = canonicalPrompt(currentStep, allocation);
renderFlow(prompt, currentStep.time, scoreTime);
renderComputerTargets(prompt, mode === 'demo' ? 'demo-note' : 'target');
```

Do not derive computer-key classes from `active`, automatic-accompaniment audio events, or MIDI pitch matches.

- [ ] **Step 3: Add six-card library and desktop layout**

Use a fixed-height, non-looping vertical rail with six complete cards. At 2560x1440 the whole practice surface must fit without horizontal overflow. Preserve reduced motion, visible focus, strong text/background contrast, and non-color status text.

- [ ] **Step 4: Wire free release and demonstration**

Physical keyup stops only that voice and updates held state. It does not alter score time or accuracy. Demonstration schedules both hands for audio in auto mode but calls `canonicalPrompt` with the melody practice step.

- [ ] **Step 5: Keep public-domain data only**

Expand `score.js` with synthetic events that exercise shared shifts, dual banks, overlapping melody, accompaniment, repeated notes, and rests. Do not add commercial melodies or user score images.

- [ ] **Step 6: Run local project validation**

Run: `node scripts/validate_project.mjs examples/generated-app`

Expected: PASS after Task 5 updates the validator; until then, retain the current offline check and record expected structural failures for four rows and flow.

### Task 5: Update structural validation

**Files:**
- Modify: `tests/project-validation.test.mjs`
- Modify: `scripts/lib/project-check.mjs`

- [ ] **Step 1: Write failing structure tests**

Require four physical row markers, a flow lane, a 61-key piano, canonical letter prompts, and offline assets. Reject the obsolete two-row marker-only fixture.

```js
assert.match(source, /1234567890-=/);
assert.match(source, /QWERTYUIOP\[\]/);
assert.match(source, /ASDFGHJKL;'/);
assert.match(source, /ZXCVBNM,\.\//);
assert.match(source, /id=["']noteFlow["']/);
assert.match(source, /id=["']piano61["']/);
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/project-validation.test.mjs`

Expected: FAIL against the old validator.

- [ ] **Step 3: Implement focused validation**

Return `{ offline, keyboardRows: 4, noteFlow: true, pianoKeys: 61, canonicalPrompt: true }`. Structural validation must not enforce brand colors or exact prose.

- [ ] **Step 4: Run and commit**

Run: `node --test tests/project-validation.test.mjs`

Expected: PASS.

Commit:

```powershell
git add scripts/lib/project-check.mjs tests/project-validation.test.mjs examples/generated-app
git commit -m "feat: upgrade the reference piano application"
```

### Task 6: Expand real-browser acceptance

**Files:**
- Modify: `tests/browser.test.mjs`

- [ ] **Step 1: Add desktop structure assertions**

At 2560x1440 assert 45 rendered physical keys (12 + 12 + 11 + 10), 35 standard playable bindings, 61 piano keys, six visible song cards, vertical ordering, and no document overflow.

- [ ] **Step 2: Add practice prompt identity regression**

Use the example's overlapping long-note group. Compare:

```js
const sets = await page.evaluate(() => ({
  flow: [...document.querySelectorAll('.flow-group.current .flow-letter')].map(el => el.textContent.trim().toUpperCase()).sort(),
  keyboard: [...document.querySelectorAll('.computer-key.target')].map(el => el.querySelector('strong').textContent.toUpperCase()).sort()
}));
expect(sets.keyboard).toEqual(sets.flow);
```

Also assert score time advances and mistake count stays unchanged after immediate keyup.

- [ ] **Step 3: Add demonstration accompaniment regression**

Start auto demonstration, wait for a simultaneous melody/accompaniment onset, and compare `.demo-note` labels with the current flow labels. Assert accompaniment audio scheduling count is greater than zero while the visible sets remain identical.

- [ ] **Step 4: Verify song rail and responsive widths**

Assert six complete cards fit the rail, wheel scrolling changes `scrollTop` without wrapping, and widths 2560, 1920, 1366, and 390 have no document horizontal overflow.

- [ ] **Step 5: Run browser tests and commit**

Run: `npm run test:browser -- --reporter=line`

Expected: all scenarios PASS with no page errors.

Commit:

```powershell
git add tests/browser.test.mjs
git commit -m "test: cover flow and keyboard prompt identity"
```

### Task 7: Rewrite Skill guidance with progressive disclosure

**Files:**
- Modify: `SKILL.md`
- Modify: `references/keyboard-mapping.md`
- Modify: `references/practice-engine.md`
- Create: `references/prompt-consistency.md`
- Modify: `references/interface-design.md`
- Modify: `references/product-spec.md`
- Modify: `references/quality-checklist.md`
- Modify: `references/audio.md`

- [ ] **Step 1: Rewrite `SKILL.md` as a router**

Its mandatory invariants must explicitly say:

```markdown
- Use the fixed 35-key chromatic performance layout; render four physical keyboard rows.
- Prefer one octave bank, use independent left/right octave banks only when necessary, and report supplemental keys.
- Treat the flow current-character array as the only source for computer-key targets in practice and demonstration.
- Keep automatic accompaniment audible but absent from melody-only target highlighting.
- Enforce a 120ms chord-onset window; long notes judge onset only and may be released immediately without penalty or waiting.
```

Route app generation/repair to all six runtime references, including the new prompt-consistency reference.

- [ ] **Step 2: Make mapping guidance executable**

Document the exact label string, code conversion table for punctuation, base MIDI 48, split index 17, candidate octave range, tie-breaking order, lock rules, dual-bank search, and supplemental-key reporting. Include one shared-bank and one dual-bank worked example.

- [ ] **Step 3: Document the practice state machine**

Specify states, transitions, counters, 120ms inclusive boundary, expired-chord retry, free release, repeated notes, pause/reset/blur cleanup, and accompaniment gating. Include pseudocode matching `PracticeModel` names.

- [ ] **Step 4: Document canonical prompt diagnostics**

Include the two demonstrated failures:

- flow `P/V`, keyboard `E/P/V` because a sustained note leaked into target highlighting;
- flow `B/D/X`, keyboard `0/6/B/D/X` because accompaniment audio leaked into demo highlighting.

Require DOM-set comparison and screenshot evidence after repair.

- [ ] **Step 5: Expand the quality checklist**

List exact unit, browser, package, quick-validator, archive-inspection, and installed-copy commands. Separate required evidence from optional visual polish.

- [ ] **Step 6: Validate and commit docs**

Run the Skill quick validator and `rg` for obsolete `19`, `Q–P / A–L`, strict-hold, and two-row claims. Any remaining occurrence must be historical context or a negative test.

Commit:

```powershell
git add SKILL.md references
git commit -m "docs: specify the piano keyboard v2 workflow"
```

### Task 8: Update public documentation and version

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `README.zh-CN.md`
- Modify: `agents/openai.yaml`
- Modify: `VALIDATION.md`
- Modify: `docs/assets/hero.svg` only if it visibly claims two rows or 19 keys

- [ ] **Step 1: Set version 2.0.0**

Run: `npm version 2.0.0 --no-git-tag-version`

Expected: both package manifests report `2.0.0`.

- [ ] **Step 2: Rewrite public claims**

README examples and diagrams must describe the four-row physical keyboard, 35-key chromatic mapping, automatic octave banks, canonical flow prompt, free long-note release, and 120ms chords. Keep installation instructions and licensing boundaries.

- [ ] **Step 3: Update UI metadata without changing invocation policy**

Keep `policy.allow_implicit_invocation: true`. Update `short_description` and `default_prompt` to mention offline flow-based practice rather than the old Q-P/A-L model.

- [ ] **Step 4: Record fresh validation evidence**

Replace old counts and environment claims in `VALIDATION.md` only after running the commands in Task 9.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json README.md README.en.md README.zh-CN.md agents/openai.yaml VALIDATION.md docs/assets/hero.svg
git commit -m "docs: publish piano keyboard skill v2"
```

Omit `docs/assets/hero.svg` from `git add` if inspection shows no obsolete claim.

### Task 9: Validate, package, and inspect the archive

**Files:**
- Modify: `scripts/package_skill.ps1` only if archive inspection exposes an exclusion defect
- Create: `scripts/install_local.ps1`

- [ ] **Step 1: Run repository validation**

Run:

```powershell
npm run validate
npm run test:browser -- --reporter=line
python C:/Users/24939/.codex/skills/.system/skill-creator/scripts/quick_validate.py .
```

Expected: all commands exit 0.

- [ ] **Step 2: Package the Skill**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_skill.ps1
```

Expected: `dist/piano-keyboard.zip` is recreated.

- [ ] **Step 3: Inspect the archive**

List ZIP entries and assert that `.git`, `node_modules`, `.npm-cache`, `dist`, `test-results`, `playwright-report`, current application files, and commercial score assets are absent. Assert that `SKILL.md`, all references, scripts, schemas, the public-domain score, and reference app are present.

- [ ] **Step 4: Add a guarded local installer**

`scripts/install_local.ps1` accepts `-Destination`, resolves both paths, refuses a destination outside an explicitly supplied directory, stages a copy excluding development artifacts, validates the staged Skill, then replaces the named `piano-keyboard` destination. It must not infer or delete broad directories.

- [ ] **Step 5: Test the installer in a temporary directory**

Use a workspace-local temporary destination first. Compare its tracked Skill files with the repository source excluding declared development artifacts.

- [ ] **Step 6: Commit packaging support**

```powershell
git add scripts/package_skill.ps1 scripts/install_local.ps1 VALIDATION.md
git commit -m "build: validate and package piano keyboard skill v2"
```

### Task 10: Synchronize, verify, and publish

**Files:**
- External install target: `C:\Users\24939\.agents\skills\piano-keyboard`

- [ ] **Step 1: Confirm repository cleanliness and commit sequence**

Run:

```powershell
git status --short
git log --oneline -10
```

Expected: no uncommitted repository changes and the v2 commits are present.

- [ ] **Step 2: Install to the authorized local destination**

Run the guarded installer with the exact destination above. This is an external filesystem mutation already authorized by the user; request sandbox elevation if required.

- [ ] **Step 3: Validate the installed copy**

Run the Codex Skill quick validator against `C:\Users\24939\.agents\skills\piano-keyboard`, compare version and `SKILL.md` hashes, and confirm obsolete 19-key instructions are absent.

- [ ] **Step 4: Final repository regression**

Run `npm run validate` and `npm run test:browser -- --reporter=line` again after installation.

- [ ] **Step 5: Push main**

Run:

```powershell
git push origin main
```

Expected: remote `main` advances to the local verified HEAD. Do not create a tag or GitHub release unless separately requested.
