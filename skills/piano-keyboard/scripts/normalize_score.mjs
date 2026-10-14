#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateScore } from './lib/score.mjs';
import { normalizeScore } from './lib/normalize.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/normalize_score.mjs <input.json> <output.json>');
  process.exit(2);
}
try {
  const score = JSON.parse(await readFile(resolve(input), 'utf8'));
  validateScore(score, { requireConfirmed: true });
  const normalized = normalizeScore(score);
  validateScore(normalized, { requireConfirmed: true });
  await writeFile(resolve(output), `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  console.log(`Normalized score written to ${resolve(output)}`);
} catch (error) {
  console.error(`Score normalization failed:\n${error.message}`);
  process.exit(1);
}
