# Product specification

## Purpose and non-goals

Build or repair a local, desktop-first piano-learning page. The player follows a flow of computer-key characters while a fixed 35-key chromatic layout automatically changes octave bank. Do not copy a reference site's branding/background, mutate source music, or require a server/framework/account.

## Required modes

- **Melody + automatic accompaniment (`auto`)**: user performs right-hand/melody targets; scheduled left-hand accompaniment sounds on the same score clock and never adds visible target letters.
- **Both hands (`both`)**: user performs both hands; use shared bank first and independent hand banks only when necessary.
- **Right hand (`right`)** and **left hand (`left`)**: filter current practice targets without editing score data.
- **Demonstration (`demo`)**: audio may play both hands; visible prompt follows the selected melody targets only.
- **Free play (`free`)**: fixed keyboard input without onset gates or accuracy scoring.

## Controls to preserve

When an existing app already exposes them, retain current song library, original-score viewing, left/right/both-hand selection, measure range, speed, pause/resume, reset, loop, volume, statistics, demo, free play, accompaniment, and metronome. A redesign is not permission to remove working product scope.

## Timing and scoring

All score events, rests, tempo changes, accompaniment, and demonstration use one score clock. The clock waits only at an unresolved required onset. Chords use the 120ms onset window. Long-note keyup never controls score advancement. Wrong notes sound and count; early/late long-note release does not.

## Visual contract

The center is vertically ordered: flow lane, four-row keyboard, 61-key piano. The left song rail shows six complete cards and scrolls without looping. Flow and computer targets are character-first; avoid permanent extra pitch labels in the flow.

## Output boundary

Ship native HTML, CSS, and JavaScript with only local assets. Opening `index.html` through `file://` must work. Include synthetic or confirmed public-domain material only in reusable Skill examples; never package a user's commercial scores or application-specific assets into the Skill.
