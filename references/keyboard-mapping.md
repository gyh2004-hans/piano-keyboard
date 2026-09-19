# Ergonomic Q–P / A–L mapping

## Physical model

```text
Q W E R T | Y U I O P
 A S D F G | H J K L
```

The divider marks preferred hand zones. Favor `A S D F` for left-hand work and `J K L P` for right-hand work.

## Allocation input and cost

For every onset, supply pitch, source hands, role (melody, bass, or accompaniment), previous mapping, and locks from keys still held.

Use ordered optimization:

- hard constraint: a held key keeps its pitch;
- hard constraint: new notes use only free keys;
- low cost: preferred home keys;
- reward: keep a pitch on its previous key;
- penalty: hand-zone crossing;
- strong penalty: reverse left-to-right pitch order;
- deterministic tie breaking by physical position.

Run `node scripts/analyze_mapping.mjs score.json` and inspect blocked groups, simplifications, maximum polyphony, and key usage.

## Preview and simplification

Future tiles show letters only. Recompute them when locks or the current group change. The current tile must match the active mapping.

For over-capacity groups: merge exact duplicates, remove accompaniment octave duplication, keep melody/bass root/chord third/chord seventh, then remove inner accompaniment by priority. Never silently remove melody. Report original, retained, and removed notes with the rationale.

Hardware ghosting may still reject a legal chord. Explain the limitation and let the player restart that group.
