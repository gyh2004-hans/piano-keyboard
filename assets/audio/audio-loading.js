(function(root){
 'use strict';
 const jobs=new Map();let dialog,dismissed=false,returnFocus;
 function create(){
  dialog=document.createElement('dialog');dialog.id='audioLoadingDialog';dialog.className='audio-loading';
  dialog.setAttribute('aria-labelledby','audioLoadingTitle');dialog.setAttribute('aria-describedby','audioLoadingDescription');
  dialog.innerHTML=`<div class="audio-loading-top"><span>慢慢弹 · 音源准备</span><button type="button" class="audio-loading-dismiss" aria-label="收起加载弹窗">收起</button></div>
   <div class="audio-loading-piano" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
   <h2 id="audioLoadingTitle">让琴声准备好</h2><p id="audioLoadingDescription">正在读取并解码本地无损采样，完成后即可演奏。</p>
   <div class="audio-loading-numbers"><strong id="audioLoadingPercent">0<span>%</span></strong><span id="audioLoadingCount">0 / 30 个采样已就绪</span></div>
   <div id="audioLoadingProgress" class="audio-loading-track" role="progressbar" aria-label="钢琴音源加载进度" aria-valuemin="0" aria-valuemax="30" aria-valuenow="0"><div></div></div>
   <p class="audio-loading-status" id="audioLoadingStatus" role="status" aria-live="polite">首次加载需要一点时间，请稍候。</p>
   <div class="audio-loading-foot"><span>Salamander Grand Piano</span><span>无损 · 本地离线</span></div>`;
  document.body.append(dialog);
  const dismiss=()=>{dismissed=true;dialog.close();};
  dialog.querySelector('button').onclick=dismiss;
  dialog.addEventListener('cancel',()=>{dismissed=true;});
  dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
 }
 root.AudioLoadingUI={report(owner,event){
  if(!dialog)create();
  if(!jobs.size&&event.state==='loading'){dismissed=false;returnFocus=document.activeElement;}
  jobs.set(owner,event);
  const active=[...jobs.values()],completed=active.reduce((n,e)=>n+e.completed,0),total=active.reduce((n,e)=>n+e.total,0);
  const percent=Math.floor(completed/total*100),failed=active.find(e=>e.state==='error'),loading=active.some(e=>e.state==='loading');
  document.getElementById('audioLoadingPercent').innerHTML=percent+'<span>%</span>';
  document.getElementById('audioLoadingCount').textContent=completed+' / '+total+' 个采样已就绪';
  const progress=document.getElementById('audioLoadingProgress');progress.setAttribute('aria-valuenow',completed);progress.setAttribute('aria-valuemax',total);progress.firstElementChild.style.transform='scaleX('+completed/total+')';
  dialog.classList.toggle('audio-loading-error',!!failed);
  document.getElementById('audioLoadingTitle').textContent=failed?'有些琴声未能载入':'让琴声准备好';
  document.getElementById('audioLoadingStatus').textContent=failed?'加载失败。请收起弹窗后重新开始；已完成的采样会保留。':dismissed?'采样继续在后台准备。':'首次加载需要一点时间；收起后会继续加载。';
  if(!dismissed&&!dialog.open)dialog.showModal();
  if(!loading){jobs.clear();if(!failed&&dialog.open)dialog.close();}
 }};
})(globalThis);
