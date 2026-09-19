# Practice engine

## Onset gate

When score time reaches a required group, wait until every pitch is newly armed and currently held. Notes may land slightly apart; accept when the complete chord is held. A previous released press does not count, and repeated pitches require release and re-press.

## Long notes

After acceptance, score time follows written rhythm. A held key can continue sounding. Early release stops its voice without reducing accuracy, pausing time, showing a countdown, or requiring a minimum duration.

## Rests and accompaniment

Rests pass naturally. Automatic accompaniment uses the user score clock. It can sound scheduled events after a gate clears, but cannot move past an unresolved onset.

## Lifecycle and scoring

Stop voices and clear held/armed state on pause, restart, song/range/version change, window blur, or document hiding. Track completed groups, attempts, correct notes, and wrong notes. Do not penalize early long-note release. Keep scoring absent or separate in free play and demonstration.
