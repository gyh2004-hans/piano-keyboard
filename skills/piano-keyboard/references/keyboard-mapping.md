# Fixed 35-key chromatic mapping

## Physical and pitch tables

Render these four physical rows exactly:

```text
1 2 3 4 5 6 7 8 9 0 - =
 Q W E R T Y U I O P [ ]
  A S D F G H J K L ; '
   Z X C V B N M , . /
```

The standard chromatic sequence is:

```text
Q 2 W 3 E R 5 T 6 Y 7 U I 9 O 0 P Z S X D C F V B H N J M , L . ; / '
```

It contains 35 keys. Standard index `x` maps to base MIDI `48 + x`; therefore one bank spans C3 (48) through A#5 (82). The default hand split is index 17: `x < 17` is left and the rest is right. Keys `A G K 1 4 8` are supplemental-only. The four rendered but inactive keys are `- = [ ]`.

Use these `KeyboardEvent.code` conversions:

| Label | Code |
|---|---|
| `0`–`9` | `Digit0`–`Digit9` |
| `A`–`Z` | `KeyA`–`KeyZ` |
| `,` | `Comma` |
| `.` | `Period` |
| `;` | `Semicolon` |
| `/` | `Slash` |
| `'` | `Quote` |
| `[` / `]` | `BracketLeft` / `BracketRight` |
| `-` / `=` | `Minus` / `Equal` |

## Allocation procedure

Input each onset as `{ note, hands, role }`, plus the previous `byCode` map and a `locks` map from currently held physical codes to sounding pitches. Never mutate the input targets.

1. Merge only exact duplicate pitches and union their hands. Do not delete melody, bass, accompaniment, or octave duplicates.
2. Search shared octave shifts from `-48` through `+72` semitones in 12-semitone steps.
3. Rank shared candidates by: fewest uncovered/locked conflicts; least movement from the previous shared shift; smallest absolute shift.
4. If the best shared bank misses a pitch, search two banks. Try split 17 first, then splits 10–24. Search the same octave range independently for left and right.
5. Rank dual candidates lexicographically by: missing pitches; hand-zone mismatches; movement from prior left/right shifts; movement from prior split; total absolute shift.
6. Materialize every standard key at `base + handShift`.
7. Overwrite any held physical code with its locked pitch and mark it `locked: true`. Never move that physical key before release.
8. Match requested pitches to equal-MIDI bindings, preferring locked bindings and then a binding in the target hand's zone.
9. Assign still-uncovered pitches to unused supplemental keys, preferring the supplemental code previously used for the same pitch. Mark and report every such binding.
10. Set `blocked: true` if any requested unique pitch remains unassigned. Keep the group in analysis output.

Return `{ byCode, targets, requested, blocked, shift, shifts, dual, split, supplemental }`. Attach `shift`, `shifts`, `dual`, and `split` to `byCode` so the next allocation can minimize movement.

## Worked examples

Shared bank: `C3(L), E4(R), G4(R)` fits shift 0. All intervals remain unchanged and `shifts.L === shifts.R === 0`.

Dual bank: `C2(L), G2(L), E5(R), B5(R)` spans more than 35 semitones. A valid result uses a lower left bank and higher right bank, with a split that keeps both hands covered. Do not fold either hand into the wrong octave.

Three-octave unison: simultaneous `B3, B4, B5` cannot all be represented by one physical semitone class in one shared bank. Assign the uncovered pitch to a supplemental key and expose that fact in the report/UI.

## Analysis and failure handling

Run:

```powershell
node scripts/analyze_mapping.mjs score.json
```

Inspect every group's `shift`, `shifts`, `dual`, `split`, `locked`, `supplemental`, and `blocked` fields. Confirm `scoreUnchanged: true`. Hardware ghosting may reject a mathematically legal chord; explain that device limitation and allow group retry without changing the score.
