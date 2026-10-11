import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetRoot, revision, inventory, gitBlob, sha256, flacInfo } from './lib/salamander.mjs';

export async function validateAudio() {
  const source = await inventory();
  const manifest = JSON.parse(await readFile(join(assetRoot,'manifest.json'),'utf8'));
  if(manifest.revision!==revision || manifest.files.length!==source.files.length)throw Error('Audio source revision/count mismatch');
  const records=new Map(manifest.files.map(f=>[f.path,f]));
  let count=0,total=0;
  for(const file of source.files) {
    const record=records.get(file.path),bytes=await readFile(join(assetRoot,'upstream',file.path));
    if(!record || bytes.length!==file.bytes || gitBlob(bytes)!==file.gitBlob || sha256(bytes)!==record.sha256)throw Error('Audio hash mismatch: '+file.path);
    if(file.path.endsWith('.flac')) {
      const info=flacInfo(bytes);
      if(info.sampleRate!==48000 || info.bits!==24 || info.channels!==2 || info.frames<=0)throw Error('Unexpected lossless format: '+file.path);
      count++;
    }
    total+=bytes.length;
  }
  if(count!==641)throw Error('The complete library must contain 641 FLAC files');
  const attacks=source.files.filter(f=>/Samples\/[A-G]#?\d+v\d+\.flac$/.test(f.path));
  if(attacks.length!==480)throw Error('Expected 30 pitch centers × 16 velocity layers');
  return {revision,sampleCount:count,attackSamples:480,auxiliarySamples:count-480,totalBytes:total,sampleRate:48000,bits:24,channels:2};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(JSON.stringify(await validateAudio(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
