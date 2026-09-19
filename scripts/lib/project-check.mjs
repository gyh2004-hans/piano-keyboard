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
  if (!source.includes('QWERTYUIOP') || !source.includes('ASDFGHJKL')) errors.push('Q–P / A–L keyboard rows are missing');
  if (!/data-queue-format=["']letters["']/.test(source)) errors.push('Next-group queue must declare letter-only format');
  if (!/\.prompt-main[^}]*\b(?:min-height|height)\s*:/s.test(source)) errors.push('The prompt region needs a fixed or minimum footprint to prevent layout movement');
  if (errors.length) throw new AggregateError(errors.map(message => new Error(message)), errors.join('\n'));
  return { root, files: files.length, offline: true, keyboardRows: true, fixedPrompt: true };
}
