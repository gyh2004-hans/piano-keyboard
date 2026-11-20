#!/usr/bin/env node
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function exportRuntime(directory){
 const out=resolve(directory);await mkdir(out,{recursive:true});
 let bundle="/* Generated from tested Skill modules. Do not hand-edit. */\n(function(){'use strict';const api={};\n";
 for(const name of ['score','normalize','keyboard-mapping','practice-model','prompt-state']){
  let source=await readFile(new URL(`lib/${name}.mjs`,import.meta.url),'utf8');
  const names=[...source.matchAll(/export (?:function|class|const) (\w+)/g)].map(m=>m[1]);
  source=source.replace(/import \{([^}]+)\} from ['"][^'"]+['"];?/g,'const {$1}=api;').replace(/export (?=function|class|const)/g,'');
  bundle+=`(()=>{\n${source}\nObject.assign(api,{${names.join(',')}});})();\n`;
 }
 bundle+='window.PianoRuntime=Object.freeze(api);})();\n';
 await writeFile(join(out,'piano-runtime.js'),bundle);
 await copyFile(new URL('../assets/interface/piano-view.js',import.meta.url),join(out,'piano-view.js'));
 await copyFile(new URL('../assets/interface/baseline.css',import.meta.url),join(out,'baseline.css'));
 return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(!process.argv[2]){console.error('Usage: node scripts/export_runtime.mjs APP');process.exitCode=2;}
 else await exportRuntime(process.argv[2]);
}
