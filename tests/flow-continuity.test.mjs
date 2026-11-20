import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('continuous lane retains node identity across seventh onset without rebound',async()=>{
 const browser=await chromium.launch({headless:true,channel:process.platform==='win32'?'msedge':undefined});
 try{const page=await browser.newPage({viewport:{width:1200,height:700}});
 await page.setContent('<div id="lane" style="width:1000px;height:260px;position:relative"></div>');
 await page.addScriptTag({content:await readFile(new URL('../skills/piano-keyboard/assets/interface/piano-view.js',import.meta.url),'utf8')});
 const result=await page.evaluate(()=>{
  const lane=document.querySelector('#lane');const groups=Array.from({length:24},(_,i)=>({id:'g'+i,time:i*.25,current:i===0,prompt:[{label:'Q'}]}));
  const scale=PianoView.flowScale(groups,1000);
  PianoView.renderFlow(lane,groups,1.49,scale);
  const node=[...lane.querySelectorAll('.flow-group')].find(n=>n.dataset.flowId==='g7');
  const before=node?.getBoundingClientRect().x;
  groups.forEach((g,i)=>g.current=i===7);
  PianoView.renderFlow(lane,groups,1.51,scale);
  const after=[...lane.querySelectorAll('.flow-group')].find(n=>n.dataset.flowId==='g7');
  const boundaryDx=after?.getBoundingClientRect().x-before;
  // Sweep across sixteen onsets; every surviving group moves only with time.
  let previous=new Map(),previousTime=0,continuous=true;
  for(let frame=0;frame<=32;frame++){
   const time=frame*.125;groups.forEach((g,i)=>g.current=i===Math.floor(time/.25));
   PianoView.renderFlow(lane,groups,time,scale);
   const next=new Map();for(const n of lane.querySelectorAll('.flow-group')){
    const x=n.getBoundingClientRect().x,old=previous.get(n.dataset.flowId);
    if(old&&(old.node!==n||Math.abs((x-old.x)+(time-previousTime)*scale)>.1))continuous=false;
    next.set(n.dataset.flowId,{node:n,x});
   }previous=next;previousTime=time;
  }
  const paused=lane.innerHTML;PianoView.renderFlow(lane,groups,4,scale);continuous=continuous&&paused===lane.innerHTML;
  return {continuous,same:!!node&&node===after,dx:boundaryDx,expected:-.02*scale,count:lane.querySelectorAll('.flow-group').length,transition:after&&getComputedStyle(after).transitionDuration};
 });
 assert.equal(result.continuous,true);assert.equal(result.same,true);assert.ok(Math.abs(result.dx-result.expected)<.1);assert.ok(result.count>7);assert.equal(result.transition,'0s');
 }finally{await browser.close();}
});
