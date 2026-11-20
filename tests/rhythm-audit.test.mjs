import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRhythm} from '../skills/piano-keyboard/scripts/audit_rhythm.mjs';
test('flags one-beat melody without claiming it is musically wrong',()=>{
 const score={ticksPerBeat:4,timeSignature:[4,4],events:Array.from({length:24},(_,i)=>({bar:1+Math.floor(i/4),tick:i%4*4,duration:4,hand:'R',notes:['C4'],source:{page:0}}))};
 const result=auditRhythm(score);assert.ok(result.warnings.includes('MELODY_MOSTLY_ONE_BEAT'));assert.ok(result.warnings.includes('MISSING_SOURCE_PAGES'));assert.equal(result.fidelityVerified,false);
});
test('unequal rhythms are summarized, never automatically certified',()=>{
 const score={ticksPerBeat:4,timeSignature:[4,4],events:[{bar:1,tick:0,duration:2,hand:'R',notes:['C4'],source:{page:1}},{bar:1,tick:3,duration:6,hand:'R',notes:['D4'],source:{page:1}}]};
 const result=auditRhythm(score);assert.equal(result.hands.R.durations['2'],1);assert.equal(result.hands.R.durations['6'],1);assert.equal(result.fidelityVerified,false);assert.ok(!result.warnings.includes('MELODY_MOSTLY_ONE_BEAT'));
});
