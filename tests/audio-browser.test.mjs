import { test, expect } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exportAudio } from '../skills/piano-keyboard/scripts/export_audio.mjs';
import { validateAudioExport } from '../skills/piano-keyboard/scripts/lib/audio-export-check.mjs';

const destination=fileURLToPath(new URL('../dist/audio-preview/',import.meta.url));
const url=pathToFileURL(destination+'/index.html').href;
test.use({channel:process.platform==='win32'?'msedge':undefined});
test.beforeAll(async()=>{await exportAudio(destination,{preview:true});});

test('loading modal reports real partial progress and fits mobile',async({page})=>{
 await page.goto(url);
 await page.evaluate(()=>{const a=AudioPreview.audio,load=a.loadSample;let count=0;window.gate=new Promise(r=>window.unlock=r);a.loadSample=async name=>{if(++count>1)await window.gate;return load(name);};});
 await page.locator('#load').click();
 await expect(page.locator('#audioLoadingProgress')).toHaveAttribute('aria-valuenow','1',{timeout:60000});
 await expect(page.locator('#audioLoadingPercent')).toHaveText('20%');
 await page.setViewportSize({width:390,height:844});
 expect(await page.locator('#audioLoadingDialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})).toBe(true);
 await page.screenshot({path:destination+'/loading.png'});
 await page.evaluate(()=>window.unlock());
 await expect(page.locator('#status')).toHaveText('已就绪，可以试听。',{timeout:60000});
 await expect(page.locator('#audioLoadingDialog')).not.toBeVisible();
 await page.locator('#load').click();await expect(page.locator('#audioLoadingDialog')).not.toBeVisible();
});

test('full exported library retains every original lossless byte', async()=>{
  test.setTimeout(120000);
  expect(await validateAudioExport(destination)).toEqual({sampleCount:641,velocityLayers:16,lossless:true});
});

test('file:// loads all 16 velocities and renders real stereo piano audio',async({page})=>{
  test.setTimeout(120000);
  const errors=[],remote=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url()))remote.push(request.url());});
  await page.goto(url);
  await page.locator('#load').click();
  await expect(page.locator('#status')).toHaveText('已就绪，可以试听。',{timeout:60000});
  const result=await page.evaluate(async()=>{
    const audio=window.AudioPreview.audio;
    await audio.preload(['C4'],{velocities:[1,27,35,37,44,47,51,57,65,73,81,89,97,105,113,121]});
    const buffers=[...audio.cache.entries()].filter(([name])=>/^C4v\d+\.flac$/.test(name));
    const decoded=audio.cache.get('C4v10.flac').buffer;
    const ctx=new OfflineAudioContext(2,48000,48000),source=ctx.createBufferSource();
    source.buffer=decoded;source.connect(ctx.destination);source.start(0);
    const rendered=await ctx.startRendering();
    const left=rendered.getChannelData(0),right=rendered.getChannelData(1);
    let power=0,difference=0;
    for(let i=0;i<left.length;i++){power+=left[i]*left[i];difference+=Math.abs(left[i]-right[i]);}
    const manual=audio.play('C4',{id:'manual'}),backing=audio.play('C4',{id:'backing',when:audio.context.currentTime+1});
    audio.release(manual);const independent=!backing.released;
    audio.stopAll();
    return {layers:buffers.length,channels:decoded.numberOfChannels,sampleRate:decoded.sampleRate,rms:Math.sqrt(power/left.length),stereoDifference:difference,independent,voices:audio.voices.size,cancelled:backing.cancelled};
  });
  expect(result.layers).toBe(16);expect(result.channels).toBe(2);expect(result.rms).toBeGreaterThan(.001);
  expect(result.stereoDifference).toBeGreaterThan(0);expect(result.independent).toBe(true);expect(result.voices).toBe(0);expect(result.cancelled).toBe(true);
  await page.locator('#chord').click();
  await expect(page.locator('#status')).toHaveText('播放 C4 · E4 · G4');
  await page.locator('#stop').click();
  await page.screenshot({path:destination+'/preview.png',fullPage:true});
  expect(errors).toEqual([]);expect(remote).toEqual([]);
});

test('two players can concurrently load the same file without losing registration',async({page})=>{
  await page.goto(url);
  await page.locator('#load').click();
  await expect(page.locator('#status')).toHaveText('已就绪，可以试听。',{timeout:60000});
  const result=await page.evaluate(async()=>{
    const a=new SalamanderAudio(),b=new SalamanderAudio();
    await Promise.all([a.preload(['A4']),b.preload(['A4'])]);
    return [a.cache.has('A4v10.flac'),b.cache.has('A4v10.flac')];
  });
  expect(result).toEqual([true,true]);
});
