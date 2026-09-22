import test from 'node:test';
import assert from 'node:assert/strict';
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

test('applies exactly the canonical label set to keyboard elements', () => {
  const element = label => {
    const classes = new Set(['target', 'matched']);
    return {
      classes,
      classList: {
        remove: (...names) => names.forEach(name => classes.delete(name)),
        toggle: (name, active) => active ? classes.add(name) : classes.delete(name)
      },
      querySelector: selector => selector === 'strong' ? { textContent: label } : null
    };
  };
  const elements = [element('P'), element('V'), element('E')];
  applyPromptClasses(elements, [{ label: 'p' }, { label: 'V' }], 'demo-note');
  assert.deepEqual(elements.map(item => item.classes.has('demo-note')), [true, true, false]);
  assert.ok(elements.every(item => !item.classes.has('target') && !item.classes.has('matched')));
});
