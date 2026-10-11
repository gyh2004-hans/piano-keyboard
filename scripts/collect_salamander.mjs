import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { assetRoot, revision, inventory, fetchBytes, gitBlob, sha256, flacInfo } from './lib/salamander.mjs';

const source = await inventory();
if (source.revision !== revision || source.files.some(f => /(^|\/)\.\.(\/|$)/.test(f.path))) throw Error('Invalid source inventory');
let next = 0, completed = 0, bytesTotal = 0;
const records = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < source.files.length) {
    const file = source.files[next++];
    const target = join(assetRoot, 'upstream', file.path);
    let bytes;
    try { bytes = await readFile(target); } catch {}
    if (!bytes || gitBlob(bytes) !== file.gitBlob) {
      bytes = await fetchBytes(file.path);
      if (bytes.length !== file.bytes || gitBlob(bytes) !== file.gitBlob) throw Error(`Upstream hash mismatch: ${file.path}`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    records.push({ ...file, sha256: sha256(bytes), ...(file.path.endsWith('.flac') ? flacInfo(bytes) : {}) });
    completed++; bytesTotal += bytes.length;
    if (completed % 40 === 0 || completed === source.files.length) console.log(`${completed}/${source.files.length} verified (${(bytesTotal / 1048576).toFixed(1)} MiB)`);
  }
}));
records.sort((a,b) => a.path.localeCompare(b.path, 'en'));
const manifest = { ...source, files: records, sampleCount: records.filter(f=>f.path.endsWith('.flac')).length, totalBytes: bytesTotal };
await writeFile(join(assetRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Complete: ${manifest.sampleCount} lossless samples, revision ${revision}`);
