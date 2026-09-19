#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateScore } from './lib/score.mjs';
import { normalizeScore } from './lib/normalize.mjs';
import { allocate } from './lib/keyboard-mapping.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/analyze_mapping.mjs <score.json>');
  process.exit(2);
}
try {
  const score = normalizeScore(JSON.parse(await readFile(resolve(file), 'utf8')));
  validateScore(score, { requireConfirmed: true });
  const groups = new Map();
  for (const event of score.events) {
    const id = `${event.bar}:${event.tick}`;
    if (!groups.has(id)) groups.set(id, []);
    for (const note of event.notes) groups.get(id).push({ note, hands: [event.hand], role: event.hand === 'R' ? 'melody' : 'accompaniment' });
  }
  let previous = new Map();
  const report = { groups: groups.size, maximumSimultaneousNotes: 0, simplifications: [], blockedGroups: [], keyUse: {} };
  for (const [id, targets] of groups) {
    const result = allocate(targets, previous);
    previous = result.byCode;
    report.maximumSimultaneousNotes = Math.max(report.maximumSimultaneousNotes, targets.length);
    if (result.simplified) report.simplifications.push({ group: id, removed: result.removed.map(item => item.note) });
    if (result.blocked) report.blockedGroups.push(id);
    for (const binding of result.byCode.values()) report.keyUse[binding.label] = (report.keyUse[binding.label] || 0) + 1;
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.blockedGroups.length) process.exitCode = 1;
} catch (error) {
  console.error(`Mapping analysis failed:\n${error.message}`);
  process.exit(1);
}
