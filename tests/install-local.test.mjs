import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const script = join(root, 'scripts', 'install_local.ps1');
const powershell = process.platform === 'win32' ? 'powershell' : 'pwsh';

test('guarded installer creates a validated clean piano-keyboard copy', { skip: !['win32', 'linux', 'darwin'].includes(process.platform) }, async () => {
  await access(script, constants.R_OK);
  const parent = await mkdtemp(join(tmpdir(), 'piano-keyboard-install-'));
  const destination = join(parent, 'piano-keyboard');
  try {
    const result = spawnSync(powershell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Destination', destination], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const pkg = JSON.parse(await readFile(join(destination, 'package.json'), 'utf8'));
    assert.equal(pkg.version, '2.0.0');
    for (const excluded of ['.git', 'node_modules', '.npm-cache', 'dist', 'test-results', 'playwright-report']) {
      await assert.rejects(() => access(join(destination, excluded)), `${excluded} must be excluded`);
    }
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test('guarded installer refuses a broad or misnamed destination', () => {
  const result = spawnSync(powershell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Destination', root], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /piano-keyboard/i);
});
