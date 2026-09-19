# Product specification

## Purpose

Build a desktop piano-learning page that removes fixed computer-keyboard pitch memorization. The user reads highlighted Q–P/A–L letters while the app maps those letters to the correct current pitches.

## Modes

- **Melody + automatic accompaniment (`auto`)**: the player performs the right hand; the app performs the left hand on the same score clock.
- **Both hands (`both`)**: the player performs both parts, with left and right keyboard zones.
- **Right hand (`right`)** and **left hand (`left`)**: select one score voice.
- **Demonstration (`demo`)**: play the selected range automatically with score rhythm.
- **Free play (`free`)**: use the same two-row controls without gating or correctness scoring.

## Range and playback controls

Provide full-score and short-range practice, original/half/three-quarter speed, looping, restart, pause, demonstration, volume, original-pitch and C2–C7 octave-adapted views.

## Time model

All user voices, automatic accompaniment, demonstrations, tempo changes, rests, and ties share one score clock. The clock waits only at an incomplete required onset. Held sound length does not control score advancement.

## Output boundary

Generate native HTML, CSS, and JavaScript with no required server, bundler, framework, account, or network service. First-version acceptance targets desktop browsers only.
