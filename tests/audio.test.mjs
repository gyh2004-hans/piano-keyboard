import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { access } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const player = new URL('../assets/audio/salamander-audio.js', import.meta.url);

test('the skill supplies one reusable sample player', async () => {
  await assert.doesNotReject(access(player), 'the canonical player is missing');
});

test('velocity boundaries and pitch regions follow upstream, not equal buckets', async () => {
  const { selectSample, midi } = require(player.pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
  assert.equal(midi('A0'), 21);
  assert.equal(midi('Db4'), midi('C#4'));
  for (const [velocity, layer] of [[1,1],[26,1],[27,2],[80,10],[81,11],[120,15],[121,16],[127,16]]) {
    assert.equal(selectSample('C4', velocity).name, `C4v${layer}.flac`);
  }
  assert.equal(selectSample(22).root, 21);
  assert.equal(selectSample(23).root, 24);
  assert.equal(selectSample('C8').root, 108);
  assert.throws(() => selectSample(109), /range/i);
  assert.throws(() => selectSample(60, 0), /velocity/i);
});

function context() {
  const sources = [];
  const parameter = () => ({ value: 1, setValueAtTime(){}, setTargetAtTime(){}, cancelAndHoldAtTime(){} });
  return { sources, currentTime: 10, state: 'running', destination: {},
    createGain: () => ({ gain: parameter(), connect(){}, disconnect(){} }),
    createBufferSource() { const s = { playbackRate: parameter(), connect(){}, disconnect(){}, start(...a){this.startArgs=a;}, stop(t){this.stopAt=t;} }; sources.push(s); return s; },
    async decodeAudioData() { return { duration: 3, length: 144000, numberOfChannels: 2 }; },
    async resume() {} };
}

test('preload progress counts decoding, cached samples, failure and retry',async()=>{
 const {SalamanderAudio}=require(player.pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
 const events=[];let fail=false;
 const audio=new SalamanderAudio({context:context(),onLoadProgress:e=>events.push(e),loadSample:async name=>{if(fail&&name==='D#4v10.flac')throw Error('missing FLAC');return new ArrayBuffer(4);}});
 await audio.preload(['C4','C4','G4']);
 assert.deepEqual(events.map(e=>e.completed),[0,1,2,2]);assert.equal(events.at(-1).state,'complete');
 fail=true;await assert.rejects(audio.preload(['C4','E4']),/missing FLAC/);assert.equal(events.at(-1).state,'error');assert.equal(events.at(-1).completed,1);
 fail=false;await audio.preload(['C4','E4']);assert.equal(events.at(-1).state,'complete');assert.equal(events.at(-1).completed,2);
});

test('same-pitch voices stay independent, pending notes cancel, and pedal releases cleanly', async () => {
  const { SalamanderAudio } = require(player.pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
  const ctx = context(); let loads = 0;
  const audio = new SalamanderAudio({ context: ctx, loadSample: async () => { loads++; return new ArrayBuffer(4); } });
  await audio.ready();
  assert.throws(() => audio.play('C4'), /preload/i);
  await Promise.all([audio.preload(['C4']), audio.preload(['C4'])]);
  assert.equal(loads, 1);
  const manual = audio.play('C4', { id: 'manual' });
  const backing = audio.play('C4', { id: 'backing', when: 20 });
  audio.release(manual);
  assert.ok(ctx.sources[0].stopAt < 20);
  assert.equal(ctx.sources[1].stopAt, undefined);
  audio.setPedal(true);
  const sustained = audio.play('C4');
  audio.release(sustained);
  assert.equal(ctx.sources[2].stopAt, undefined);
  audio.setPedal(false);
  assert.ok(ctx.sources[2].stopAt > ctx.currentTime);
  audio.stopAll();
  assert.equal(ctx.sources[1].stopAt, ctx.currentTime);
  assert.equal(audio.voices.size, 0);
  assert.equal(backing.cancelled, true);
});

test('a missing sample rejects explicitly and never falls back to oscillators', async () => {
  const { SalamanderAudio } = require(player.pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
  const audio = new SalamanderAudio({ context: context(), loadSample: async () => { throw Error('missing FLAC'); } });
  await assert.rejects(audio.preload(['C4']), /missing FLAC/);
  assert.throws(() => audio.play('C4'), /preload/i);
});
