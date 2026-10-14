import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { assetRoot, sha256 } from './salamander.mjs';

export async function validateAudioExport(root) {
  const audio=join(root,'audio');
  let manifest;
  try{manifest=JSON.parse(await readFile(join(audio,'manifest.json'),'utf8'));}catch{throw Error('Missing standard Salamander audio export; run scripts/export_audio.mjs');}
  const canonical=JSON.parse(await readFile(join(assetRoot,'manifest.json'),'utf8'));
  if(JSON.stringify(manifest)!==JSON.stringify(canonical))throw Error('Salamander audio manifest differs from the complete canonical library');
  const player=await readFile(join(audio,'salamander-audio.js'));
  const original=await readFile(new URL('../../assets/audio/salamander-audio.js',import.meta.url));
  if(sha256(player)!==sha256(original))throw Error('Canonical Salamander player was modified');
  for(const name of ['audio-loading.js','audio-loading.css']){
    const exported=await readFile(join(audio,name)),canonicalUI=await readFile(new URL('../../assets/audio/'+name,import.meta.url));
    if(sha256(exported)!==sha256(canonicalUI))throw Error('Audio loading component differs: '+name);
  }
  for(const file of manifest.files.filter(f=>f.path.endsWith('.flac'))) {
    const name=file.path.slice('Samples/'.length);
    let script;
    try{script=await readFile(join(audio,'samples',name+'.js'),'utf8');}catch{throw Error('Missing audio sample: '+name);}
    const match=/^SalamanderSamples\.register\(("(?:[^"\\]|\\.)*"),("[A-Za-z0-9+/=]*")\);\n$/.exec(script);
    if(!match || JSON.parse(match[1])!==name || sha256(Buffer.from(JSON.parse(match[2]),'base64'))!==file.sha256)throw Error('Audio sample hash mismatch: '+name);
  }
  const license=await readFile(join(audio,'LICENSE-Salamander.txt'));
  if(sha256(license)!==canonical.files.find(f=>f.path==='LICENSE').sha256)throw Error('Missing or modified Salamander license');
  const attribution=await readFile(join(audio,'ATTRIBUTION.md'),'utf8');
  if(!attribution.includes('Alexander Holm')||!attribution.includes('CC BY 3.0'))throw Error('Missing Salamander attribution');
  return {sampleCount:641,velocityLayers:16,lossless:true};
}
