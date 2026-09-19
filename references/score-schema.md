# Piano score data

The authoritative machine contract is [`../schemas/piano-score.schema.json`](../schemas/piano-score.schema.json).

## Position model

`ticksPerBeat` defines score resolution. An event position is:

```text
(bar - 1) × timeSignature[0] × ticksPerBeat + tick
```

`bar` is one-based; `tick` is zero-based. `duration` uses the same ticks.

## Event model

```json
{
  "bar": 2,
  "tick": 8,
  "duration": 4,
  "hand": "R",
  "notes": ["Eb4", "G4"],
  "tie": false,
  "source": { "page": 1, "region": "system-2" }
}
```

Use scientific pitch notation such as `C4`, `F#4`, and `Bb3`. Preserve hand provenance when voices share a pitch.

## Tempo and normalization

Each tempo entry has `bar`, `tick`, and positive `bpm`. Practice speed multiplies tempo and never creates a hold threshold.

```powershell
node scripts/validate_score.mjs score.json
node scripts/normalize_score.mjs score.json normalized.json
```

Normalization orders events, merges same-hand simultaneous events, removes duplicate pitches, assigns stable IDs, and preserves the input object.
