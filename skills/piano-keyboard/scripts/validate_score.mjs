#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateScore } from './lib/score.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate_score.mjs <score.json>');
  process.exit(2);
}
try {
  const score = JSON.parse(await readFile(resolve(file), 'utf8'));
  validateScore(score, { requireConfirmed: true });
  console.log(`Valid score: ${score.title} | ${score.bars} bars | ${score.events.length} events`);
} catch (error) {
  console.error(`Score validation failed:\n${error.message}`);
  process.exit(1);
}
