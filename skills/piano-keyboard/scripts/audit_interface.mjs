#!/usr/bin/env node
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// This function runs in the page, so it must not capture Node variables.
export function inspectInterface() {
  const errors=[];
  const check=(ok,message)=>{if(!ok)errors.push(message);};
  const visible=e=>!!e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden';
  const all=s=>[...document.querySelectorAll(s)].filter(visible);
  const box=s=>document.querySelector(s)?.getBoundingClientRect();
  const width=innerWidth;
  for(const selector of ['#noteFlow','#computerKeyboard']){
    const element=document.querySelector(selector);if(!element)continue;
    const b=element.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2;
    if(x>=0&&x<innerWidth&&y>=0&&y<innerHeight){const top=document.elementFromPoint(x,y);check(top&&(element===top||element.contains(top)),`Baseline region covered: ${selector}`);}
  }
  check(document.documentElement.scrollWidth<=width+1,'Document horizontal overflow');
  check(getComputedStyle(document.body).backgroundColor==='rgb(247, 246, 242)','Expected paper background #f7f6f2');
  check(all('#computerKeyboard .computer-key').length===45,'Expected 45 visible physical keys');
  check(all('#computerKeyboard .computer-key.standard').length===35,'Expected 35 standard keys');
  check(all('#piano61 .piano-key').length===61,'Expected 61 piano keys');
  check(all('#piano61 .piano-key.white').length===36&&all('#piano61 .piano-key.black').length===25,'Expected 36 white and 25 black keys');
  check(JSON.stringify(all('[data-mode]').map(e=>e.dataset.mode).sort())===JSON.stringify(['auto','both','demo','free','left','right']),'Expected six distinct mode controls');
  const cards=all('#songRail .song-card');
  check(cards.length>0,'Expected real song cards');
  check(cards.every(e=>e.tagName==='BUTTON'&&!e.disabled&&!/即将推出|coming soon/i.test(e.textContent)),'Song cards must be enabled real buttons, not placeholders');
  const rail=box('#songRail'),flow=box('#noteFlow'),keyboard=box('#computerKeyboard'),piano=box('#piano61');
  check(!!rail&&!!flow&&!!keyboard&&!!piano,'Missing visible baseline regions');
  if(flow&&keyboard&&piano)check(flow.bottom<=keyboard.top+1&&keyboard.bottom<=piano.top+1,'Expected flow → keyboard → piano');
  if(width===2560&&flow&&keyboard&&piano&&rail){
    check(Math.abs(flow.height-260)<=2,'Expected 260px flow at primary desktop');
    check(Math.abs(piano.height-190)<=2,'Expected 190px piano at primary desktop');
    check(Math.abs(rail.height-660)<=2,'Expected 660px song rail');
    const fully=cards.filter(e=>{const b=e.getBoundingClientRect();return b.top>=rail.top-.5&&b.bottom<=rail.bottom+.5;}).length;
    check(fully===Math.min(6,cards.length),'Expected six complete cards or all available songs');
    const settings=box('.baseline-settings');
    check(!!settings&&rail.right<flow.left&&keyboard.right<settings.left,'Expected library / practice / settings columns');
  }
  return {width,height:innerHeight,errors,counts:{songs:cards.length,physicalKeys:all('#computerKeyboard .computer-key').length}};
}

export async function audit(directory,evidence) {
  const require=createRequire(import.meta.url);
  let chromium;
  try { ({chromium}=require('playwright')); } catch { try {({chromium}=require('@playwright/test'));}catch{throw Error('Browser audit requires playwright or @playwright/test in the Skill environment.');} }
  await mkdir(evidence,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:process.env.PIANO_BROWSER_CHANNEL||(process.platform==='win32'?'msedge':undefined)});
  const results=[];
  try {
    for(const [width,height] of [[2560,1440],[1920,1080],[1366,768],[390,844]]){
      const page=await browser.newPage({viewport:{width,height}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(join(resolve(directory),'index.html')).href);
      await page.evaluate(()=>document.fonts.ready);
      const report=await page.evaluate(inspectInterface);
      report.errors.push(...errors.map(e=>'Page error: '+e));
      await page.screenshot({path:join(evidence,`${width}x${height}.png`),fullPage:true});
      results.push(report);await page.close();
    }
  } finally {await browser.close();}
  await writeFile(join(evidence,'interface-audit.json'),JSON.stringify(results,null,2));
  if(results.some(r=>r.errors.length))throw Error(results.map(r=>`${r.width}: ${r.errors.join('; ')||'PASS'}`).join('\n'));
  return results;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(!process.argv[2]||!process.argv[3]){console.error('Usage: node scripts/audit_interface.mjs APP EVIDENCE');process.exitCode=2;}
  else try{await audit(process.argv[2],resolve(process.argv[3]));console.log('Interface geometry passed; inspect screenshots and test interactions separately.');}catch(e){console.error(e.message);process.exitCode=1;}
}
