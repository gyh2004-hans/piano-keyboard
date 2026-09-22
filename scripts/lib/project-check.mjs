import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

async function filesUnder(root) {
  const found = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) found.push(...await filesUnder(path));
    else found.push(path);
  }
  return found;
}

export async function validateProject(input) {
  const root = input instanceof URL ? fileURLToPath(input) : resolve(input);
  const index = join(root, 'index.html');
  try { await access(index, constants.R_OK); } catch { throw new Error('Missing required index.html'); }
  const files = (await filesUnder(root)).filter(file => /\.(html|css|js|json)$/i.test(file));
  const contents = await Promise.all(files.map(file => readFile(file, 'utf8')));
  const source = contents.join('\n');
  const errors = [];
  if (/\b(?:https?:)?\/\//i.test(source)) errors.push('Remote runtime resource found; generated apps must work offline');
  const rows = ['1234567890-=', 'QWERTYUIOP[]', "ASDFGHJKL;'", 'ZXCVBNM,./'];
  if (!rows.every(row => source.includes(row))) errors.push('All four physical keyboard rows are required');
  if (!/id=["']noteFlow["']/.test(source)) errors.push('A note flow lane with id="noteFlow" is required');
  if (!/id=["']piano61["'][^>]*data-key-count=["']61["']/.test(source)) errors.push('The center piano must declare all 61 keys');
  if (!/\bcanonicalPrompt\b/.test(source)) errors.push('Flow and keyboard targets must use a canonicalPrompt source');
  if (!/\.note-flow[^}]*\b(?:min-height|height)\s*:/s.test(source)) errors.push('The flow prompt region needs a fixed or minimum footprint to prevent layout movement');
  if (errors.length) throw new AggregateError(errors.map(message => new Error(message)), errors.join('\n'));
  return { root, files: files.length, offline: true, keyboardRows: 4, noteFlow: true, pianoKeys: 61, canonicalPrompt: true, fixedPrompt: true };
}
