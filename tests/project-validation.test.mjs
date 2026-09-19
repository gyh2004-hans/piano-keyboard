import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProject } from '../scripts/lib/project-check.mjs';

async function project(files) {
  const root = await mkdtemp(join(tmpdir(), 'piano-keyboard-'));
  await mkdir(root, { recursive: true });
  for (const [name, content] of Object.entries(files)) await writeFile(join(root, name), content);
  return root;
}

test('rejects a missing entry page', async () => {
  const root = await project({ 'app.js': '' });
  await assert.rejects(() => validateProject(root), /index\.html/);
});

test('rejects remote runtime resources', async () => {
  const root = await project({
    'index.html': '<script src="https://cdn.example/app.js"></script>',
    'app.js': 'const rows="QWERTYUIOP ASDFGHJKL"; const queueFormat="letters";',
    'styles.css': '.prompt-main{min-height:60px}'
  });
  await assert.rejects(() => validateProject(root), /remote runtime/i);
});

test('rejects projects without the keyboard and stable prompt contract', async () => {
  const root = await project({ 'index.html': '<main></main>', 'app.js': '', 'styles.css': '' });
  await assert.rejects(() => validateProject(root), /Q–P|prompt/i);
});

test('accepts the generated reference app', async () => {
  const root = new URL('../examples/generated-app/', import.meta.url);
  const report = await validateProject(root);
  assert.equal(report.offline, true);
  assert.equal(report.keyboardRows, true);
  assert.equal(report.fixedPrompt, true);
});
