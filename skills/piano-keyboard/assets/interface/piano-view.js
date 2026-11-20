/* Reusable view only. Input must be derived from the canonical score clock. */
(function(){'use strict';
 function flowScale(groups,width){
  const gaps=groups.slice(1).map((g,i)=>g.time-groups[i].time).filter(x=>x>0);
  return Math.max(width*.72/6,gaps.length?40/Math.min(...gaps):0);
 }
 function layoutFlow(groups,time,width,scale=flowScale(groups,width)){
  return groups.map(group=>({group,x:width*.28+(group.time-time)*scale}));
 }
 function renderFlow(lane,groups,time,scale){
  let notes=lane.querySelector('.flow-notes');if(!notes){notes=document.createElement('div');notes.className='flow-notes';notes.style.cssText='position:absolute;inset:0;pointer-events:none';lane.append(notes);}
  const existing=new Map([...notes.children].map(n=>[n.dataset.flowId,n]));
  const retained=new Set();
  for(const {group,x} of layoutFlow(groups,time,lane.clientWidth,scale)){
   if(x < -80 || x > lane.clientWidth+80)continue;
   const id=String(group.id??group.time);if(retained.has(id))throw Error('Merge simultaneous notes into one flow group; group IDs must be unique');retained.add(id);
   let node=existing.get(id);if(!node){node=document.createElement('div');node.dataset.flowId=id;notes.append(node);}
   node.className='flow-group '+(group.current?'current':group.time<time?'past':'future');node.style.left='0';node.style.transition='none';node.style.animation='none';node.style.transform=`translate(${x}px,-50%)`;
   const signature=JSON.stringify(group.prompt.map(p=>p.label));
   if(node.dataset.prompt!==signature){node.replaceChildren();node.dataset.prompt=signature;
    for(const item of group.prompt){const letter=document.createElement('span');letter.className='flow-letter';letter.textContent=item.label.toLowerCase();node.append(letter);}
   }
  }
  for(const [id,node] of existing)if(!retained.has(id))node.remove();
 }
 function renderPiano(container){
  container.replaceChildren();let whites=0;
  for(let midi=36;midi<=96;midi++){
   const black=[1,3,6,8,10].includes(midi%12),key=document.createElement('button');key.type='button';key.className='piano-key '+(black?'black':'white');key.dataset.midi=String(midi);
   const note=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][midi%12]+(Math.floor(midi/12)-1);
   key.setAttribute('aria-label',note);if(black)key.style.left=`calc(${whites/36*100}% - .85%)`;else whites++;
   const pitch=document.createElement('span');pitch.className='pitch';pitch.textContent=note;
   const binding=document.createElement('span');binding.className='letter';key.append(pitch,binding);container.append(key);
  }
 }
 window.PianoView=Object.freeze({flowScale,layoutFlow,renderFlow,renderPiano});
})();
