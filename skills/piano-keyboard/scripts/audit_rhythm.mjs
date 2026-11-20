#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function auditRhythm(score){
 if(!Number.isFinite(score.ticksPerBeat)||score.ticksPerBeat<=0||!Array.isArray(score.events))throw Error('Expected score events and positive ticksPerBeat');
 const warnings=[],hands={};
 for(const hand of ['L','R']){
  const events=score.events.filter(e=>e.hand===hand&&e.notes?.length);
  const durations={};for(const e of events)durations[e.duration]=(durations[e.duration]||0)+1;
  hands[hand]={events:events.length,durations,oneBeatRatio:events.length?events.filter(e=>e.duration===score.ticksPerBeat).length/events.length:0};
 }
 if(hands.R.events>=16&&hands.R.oneBeatRatio>=.8)warnings.push('MELODY_MOSTLY_ONE_BEAT');
 if(score.events.some(e=>e.notes?.length&&(!e.source||!(e.source.page>0))))warnings.push('MISSING_SOURCE_PAGES');
 return {hands,warnings,fidelityVerified:false,requiredEvidence:'Compare onset ticks, durations, rests and ties against original source measures in rhythm-review.md. Distribution alone cannot verify musical rhythm.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(!process.argv[2])throw Error('Usage: node scripts/audit_rhythm.mjs SCORE_JSON');const result=auditRhythm(JSON.parse(await readFile(process.argv[2],'utf8')));console.log(JSON.stringify(result,null,2));if(result.warnings.length)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=2;}
}
