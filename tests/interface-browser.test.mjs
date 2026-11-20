import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {inspectInterface} from '../skills/piano-keyboard/scripts/audit_interface.mjs';
test('recipe renders four sizes; rejects dark compact variant',async()=>{
 const root=new URL('../skills/piano-keyboard/',import.meta.url);
 const css=await readFile(new URL('assets/interface/baseline.css',root),'utf8');
 const recipe=await readFile(new URL('references/baseline-recipe.md',root),'utf8');
 const html=recipe.match(/```html\r?\n([\s\S]*?)```/)[1];
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
 try{for(const [width,height]of [[2560,1440],[1920,1080],[1366,768],[390,844]]){
 const page=await browser.newPage({viewport:{width,height}});await page.setContent('<style>'+css+'</style>'+html);
 await page.evaluate(()=>{
 const rail=document.querySelector('#songRail');for(let i=0;i<8;i++)rail.insertAdjacentHTML('beforeend','<button class="song-card">Synthetic layout fixture</button>');
 const rows=['1234567890-=','QWERTYUIOP[]',"ASDFGHJKL;'",'ZXCVBNM,./'];let n=0;
 document.querySelector('#computerKeyboard').innerHTML=rows.map(row=>'<div class="computer-row">'+[...row].map(c=>`<button class="computer-key ${n++<35?'standard':'inactive'}"><strong>${c}</strong></button>`).join('')+'</div>').join('');
 let whites=0;for(let midi=36;midi<=96;midi++){const black=[1,3,6,8,10].includes(midi%12);document.querySelector('#piano61').insertAdjacentHTML('beforeend',`<button class="piano-key ${black?'black':'white'}" style="${black?'left:calc('+whites/36*100+'% - .85%)':''}"></button>`);if(!black)whites++;}
 document.querySelector('.baseline-settings').innerHTML=['auto','both','right','left','demo','free'].map(m=>`<button data-mode="${m}">${m}</button>`).join('');
 });
 const result=await page.evaluate(inspectInterface);assert.deepEqual(result.errors,[],JSON.stringify(result));
 if(width===2560){await page.evaluate(()=>{const overlay=document.createElement('div');overlay.id='cover';overlay.style.cssText='position:fixed;inset:0;z-index:999;background:white';document.body.append(overlay);});const covered=await page.evaluate(inspectInterface);assert.ok(covered.errors.some(e=>e.includes('covered')));await page.locator('#cover').evaluate(e=>e.remove());}
 await page.addStyleTag({content:'body{background:#14161b}#noteFlow{height:120px}'});const bad=await page.evaluate(inspectInterface);assert.ok(bad.errors.some(e=>e.includes('background')));if(width===2560)assert.ok(bad.errors.some(e=>e.includes('260px')));await page.close();
 }}finally{await browser.close();}
});
