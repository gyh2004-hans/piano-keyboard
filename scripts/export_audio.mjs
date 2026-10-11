import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetRoot, sha256, gitBlob } from './lib/salamander.mjs';

const skillRoot=fileURLToPath(new URL('../',import.meta.url));
export async function exportAudio(destination,{preview=false}={}) {
  const app=resolve(destination),audio=join(app,'audio');
  if(app===resolve(skillRoot) || app===resolve(assetRoot))throw Error('Destination must be a generated application directory');
  const manifest=JSON.parse(await readFile(join(assetRoot,'manifest.json'),'utf8'));
  if(manifest.sampleCount!==641)throw Error('Collect the complete Salamander library first');
  const player=await readFile(join(skillRoot,'assets/audio/salamander-audio.js'));
  const fingerprint=sha256(Buffer.concat([player,Buffer.from(JSON.stringify(manifest))]));
  let previous;
  try {previous=JSON.parse(await readFile(join(audio,'export.json'),'utf8'));}catch{}
  try {await access(audio);if(!previous?.generatedBy)throw Error('Refusing to overwrite an existing unowned audio directory');}catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(join(audio,'samples'),{recursive:true});
  let samples=0;
  for(const file of manifest.files.filter(f=>f.path.endsWith('.flac'))) {
    const name=file.path.slice('Samples/'.length),target=join(audio,'samples',name+'.js');
    if(previous?.fingerprint===fingerprint) {try{await access(target);samples++;continue;}catch{}}
    const bytes=await readFile(join(assetRoot,'upstream',file.path));
    if(sha256(bytes)!==file.sha256 || gitBlob(bytes)!==file.gitBlob)throw Error('Corrupted source sample: '+file.path);
    await writeFile(target,`SalamanderSamples.register(${JSON.stringify(name)},${JSON.stringify(bytes.toString('base64'))});\n`);
    samples++;
  }
  await writeFile(join(audio,'salamander-audio.js'),player);
  for(const name of ['audio-loading.js','audio-loading.css'])await copyFile(join(skillRoot,'assets/audio',name),join(audio,name));
  await writeFile(join(audio,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await copyFile(join(assetRoot,'upstream/LICENSE'),join(audio,'LICENSE-Salamander.txt'));
  await copyFile(join(assetRoot,'ATTRIBUTION.md'),join(audio,'ATTRIBUTION.md'));
  await writeFile(join(audio,'export.json'),JSON.stringify({generatedBy:'piano-keyboard/export_audio',fingerprint,samples,revision:manifest.revision},null,2)+'\n');
  if(preview) await copyFile(join(skillRoot,'examples/audio-preview/index.html'),join(app,'index.html'));
  return {app,samples,revision:manifest.revision};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {if(!process.argv[2])throw Error('Usage: node scripts/export_audio.mjs APP_DIRECTORY [--preview]');console.log(JSON.stringify(await exportAudio(process.argv[2],{preview:process.argv.includes('--preview')}),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
