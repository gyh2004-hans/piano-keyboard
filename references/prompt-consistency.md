# Canonical visible-prompt contract

## One source of truth

For every render, derive one array from the current practice step and current allocation:

```js
const prompt = canonicalPrompt(currentStep, allocation);
renderFlow(prompt, scoreTime);
renderComputerTargets(prompt, mode === 'demo' ? 'demo-note' : 'target');
```

`canonicalPrompt` reads only `currentStep.targets`. It maps each target pitch through `allocation.targets` and returns `{ target, binding, label }`. Both visible layers consume the same array instance or an immutable copy of it.

Never derive keyboard target classes from:

- `active` or previously accepted sustained notes;
- physically held notes;
- all notes sharing a MIDI pitch;
- automatic-accompaniment events;
- demonstration audio events;
- the full `byCode` map.

Those sources may control sound, pressed-state styling, locks, or the piano visualization, but not target letters.

## Practice regression

Failure signature: the flow shows `P / V`, while the keyboard highlights `E / P / V`. `E` leaked from an accepted sustained note in `active`.

Repair by separating:

- `mappingTargets`: enough notes to preserve locks and map the current group;
- `promptTargets`: exactly `currentStep.targets`;
- `held/down`: physical state styling only.

After repair, compare DOM sets:

```js
const flow = [...document.querySelectorAll('.flow-group.current .flow-letter')]
  .map(element => element.textContent.trim().toUpperCase()).sort();
const keyboard = [...document.querySelectorAll('.computer-key.target')]
  .map(element => element.querySelector('strong').textContent.trim().toUpperCase()).sort();
expect(keyboard).toEqual(flow);
```

## Demonstration regression

Failure signature: the flow shows `B / D / X`, while the keyboard highlights `0 / 6 / B / D / X`. `0 / 6` came from accompaniment audio.

The demonstration scheduler may play both hands, but `canonicalPrompt` receives the selected melody practice step. Compare `.computer-key.demo-note` against current flow letters while confirming that accompaniment scheduling count is greater than zero.

## Required evidence

For both practice and demo:

1. capture the flow set and keyboard target set at the same animation frame;
2. assert exact sorted equality and equal cardinality;
3. include an overlapping long-note practice group;
4. include a simultaneous melody/accompaniment demo group;
5. confirm no page errors;
6. retain a screenshot when fixing a real UI regression, with the tested sets recorded beside it.

Do not accept visual inspection alone; the original mismatch can be subtle and song-dependent.
