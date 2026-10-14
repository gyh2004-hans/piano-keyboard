import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
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
    const result = spawnSync(powershell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Destination', destination], { cwd: root, encoding: 'utf8', env: { ...process.env, USERPROFILE: parent } });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    await access(join(destination, 'SKILL.md'));
    await access(join(destination, 'scripts/collect_salamander.mjs'));
    const audio = spawnSync(process.execPath, [join(destination, 'scripts/validate_audio.mjs')], { encoding: 'utf8' });
    assert.equal(audio.status, 0, audio.stderr);
    const source = join(root, 'examples/public-domain-score/score.json');
    const validated = spawnSync(process.execPath, [join(destination, 'scripts/validate_score.mjs'), source], { encoding: 'utf8' });
    assert.equal(validated.status, 0, validated.stderr);
    const isolated = spawnSync(process.execPath, ['--input-type=module', '-e', "import { upstreamRoot, assetRoot } from './scripts/lib/salamander.mjs'; import { join } from 'node:path'; if (upstreamRoot !== join(assetRoot, 'upstream')) process.exit(1);"], { cwd: destination, encoding: 'utf8' });
    assert.equal(isolated.status, 0, isolated.stderr);

    for (const excluded of ['.git', 'node_modules', '.npm-cache', 'dist', 'test-results', 'playwright-report', 'tests', 'docs', 'package.json']) {
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
