import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const skill = join(root, 'skills/piano-keyboard');
test('npx discovers only a self-contained skill with bundled audio', async () => {
  await access(join(skill, 'SKILL.md'));
  await assert.rejects(access(join(root, 'SKILL.md')));
  for (const path of ['references/audio.md', 'scripts/collect_salamander.mjs', 'scripts/validate_score.mjs', 'schemas/piano-score.schema.json', 'assets/audio/salamander-audio.js', 'assets/salamander/source.json', 'LICENSE']) await access(join(skill, path));
  for (const path of ['tests', 'docs', 'examples/generated-app', 'node_modules', 'package-lock.json']) await assert.rejects(access(join(skill, path)));
  const text = await readFile(join(skill, 'SKILL.md'), 'utf8');
  for (const match of text.matchAll(/\]\((references\/[^)#]+)\)/g)) await access(join(skill, match[1]));
  const source = JSON.parse(await readFile(join(skill, 'assets/salamander/source.json'), 'utf8'));
  for (const file of source.files) assert.equal((await stat(join(skill, 'assets/salamander/upstream', file.path))).size, file.bytes);
  assert.equal(source.files.filter(file => file.path.endsWith('.flac')).length, 641);
  let bytes = 0;
  async function count(dir) { for (const file of await readdir(dir, { withFileTypes: true })) { const path = join(dir, file.name); if (path === join(skill, 'assets/salamander/upstream')) continue; if (file.isDirectory()) await count(path); else bytes += (await stat(path)).size; } }
  await count(skill);
  assert.ok(bytes < 2 * 1024 * 1024, `Skill content excluding bundled audio must stay below 2 MiB, got ${bytes}`);
});
