import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const revision = '3382bf9496bba2486f5ab0de55a264d1dfc38404';
export const assetRoot = fileURLToPath(new URL('../../assets/salamander/', import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function gitBlob(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
export function flacInfo(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'fLaC' || (bytes[4] & 127) !== 0 || bytes.readUIntBE(5, 3) !== 34) throw Error('Invalid FLAC STREAMINFO');
  const info = bytes.readBigUInt64BE(18);
  const sampleRate = Number(info >> 44n);
  const channels = Number((info >> 41n) & 7n) + 1;
  const bits = Number((info >> 36n) & 31n) + 1;
  const frames = Number(info & 0xfffffffffn);
  return { sampleRate, channels, bits, frames, duration: frames / sampleRate };
}
export async function inventory() {
  return JSON.parse(await readFile(new URL('../../assets/salamander/source.json', import.meta.url), 'utf8'));
}
export async function fetchBytes(path, attempts = 6) {
  const url = `https://raw.githubusercontent.com/sfzinstruments/SalamanderGrandPiano/${revision}/${path.split('/').map(encodeURIComponent).join('/')}`;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === attempts - 1) throw Error(`${path}: ${error.message}`, { cause: error });
      await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
}
