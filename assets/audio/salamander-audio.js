(function(root) {
  'use strict';
  const velocityEnds = [26,34,36,43,46,50,56,64,72,80,88,96,104,112,120,127];
  const retune = [10,13,11,-3,-9,-9,-11,-7,-4,0,-6,-3,-3,-6,-3,0,-4,-8,-8,-5,-7,-8,-12,-13,-12,-17,-17,-27,-38,-38];
  const pitchNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const centers = Array.from({length:30}, (_,i)=>21+i*3);
  function midi(note) {
    if (Number.isInteger(note)) return note;
    const match = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(note);
    if (!match) throw Error('Invalid note: '+note);
    return (Number(match[3])+1)*12 + {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[match[1].toUpperCase()] + (match[2]==='#'?1:match[2]==='b'?-1:0);
  }
  function selectSample(note, velocity=80) {
    const value = midi(note);
    if (value<21 || value>108) throw Error('Piano range is A0–C8 (MIDI 21–108)');
    if (!Number.isInteger(velocity) || velocity<1 || velocity>127) throw Error('MIDI velocity must be 1–127');
    const index = Math.max(0, Math.min(29, Math.round((value-21)/3)));
    const center = centers[index], layer = velocityEnds.findIndex(end=>velocity<=end)+1;
    return { name: pitchNames[center%12]+(Math.floor(center/12)-1)+'v'+layer+'.flac', root:center, midi:value, layer, region:index, cents:retune[index] };
  }
  const encoded = new Map(), scriptLoads = new Map();
  const playerScript = root.document && root.document.currentScript && root.document.currentScript.src;
  function register(name, base64) { encoded.set(name, base64); }
  async function loadLocal(base, name) {
    if (!root.document) throw Error('A browser document or loadSample callback is required');
    const url = new URL('samples/'+encodeURIComponent(name)+'.js', base).href;
    if (!scriptLoads.has(url)) scriptLoads.set(url, new Promise((resolve,reject)=> {
      const script = root.document.createElement('script');
      script.src=url;
      const timer=setTimeout(()=>{script.remove();reject(Error('Timed out loading '+name));},30000);
      script.onload=()=>{clearTimeout(timer);script.remove();const text=encoded.get(name);encoded.delete(name);if(!text){reject(Error('Sample did not register: '+name));return;}const bytes=root.atob(text);resolve(Uint8Array.from(bytes,char=>char.charCodeAt(0)).buffer);};
      script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('Missing local sample: '+name));};
      root.document.head.append(script);
    }).finally(()=>scriptLoads.delete(url)));
    return (await scriptLoads.get(url)).slice(0);
  }
  class SalamanderAudio {
    constructor({context=null,baseUrl,loadSample,volume=.65,tuning='retuned',cacheMiB=256,onLoadProgress}={}) {
      if (!['natural','retuned'].includes(tuning)) throw Error('Unknown tuning');
      this.context=context;this.master=null;this.volume=volume;this.tuning=tuning;
      this.onLoadProgress=onLoadProgress;
      this.baseUrl=baseUrl || (playerScript ? new URL('./',playerScript).href : null);
      this.loadSample=loadSample || (name=>loadLocal(this.baseUrl,name));
      this.cache=new Map();this.pending=new Map();this.voices=new Map();this.pedal=false;this.serial=0;
      this.preloaded=new Set();
      this.cacheLimit=cacheMiB*1048576;this.cacheBytes=0;
    }
    async ready() {
      if (!this.context) this.context=new (root.AudioContext||root.webkitAudioContext)();
      if (!this.master) {this.master=this.context.createGain();this.master.gain.value=this.volume*.35;this.master.connect(this.context.destination);}
      if (this.context.state!=='running') await this.context.resume();
      if (this.context.state!=='running') throw Error('Audio could not start after user gesture');
      return this.context;
    }
    async buffer(name) {
      if (this.cache.has(name)) {const entry=this.cache.get(name);this.cache.delete(name);this.cache.set(name,entry);return entry.buffer;}
      if (!this.pending.has(name)) this.pending.set(name,(async()=>{
        const bytes=await this.loadSample(name);
        let buffer;
        try {buffer=await this.context.decodeAudioData(bytes);} catch(error) {throw Error('Lossless FLAC decoding failed: '+name+'; use a FLAC-capable browser', {cause:error});}
        const size=buffer.length*buffer.numberOfChannels*4;
        this.cache.set(name,{buffer,size});this.cacheBytes+=size;
        return buffer;
      })().finally(()=>this.pending.delete(name)));
      return this.pending.get(name);
    }
    trimCache(protectedNames=new Set()) {
      for (const [name,entry] of this.cache) {
        if (this.cacheBytes<=this.cacheLimit) break;
        if (!protectedNames.has(name)) {this.cache.delete(name);this.cacheBytes-=entry.size;}
      }
    }
    async preload(notes,{velocity=80,velocities=[velocity]}={}) {
      const names=[...new Set(notes.flatMap(note=>velocities.map(v=>selectSample(note,v).name)))];
      let cursor=0,completed=names.filter(name=>this.cache.has(name)).length;
      const missing=names.filter(name=>!this.cache.has(name)),job={};
      const report=(state,error)=>{const event={state,completed,total:names.length,error};this.onLoadProgress?.(event);if(missing.length)root.AudioLoadingUI?.report(job,event);};
      report('loading');
      try{
        await this.ready();
        const results=await Promise.allSettled(Array.from({length:Math.min(4,missing.length)},async()=>{while(cursor<missing.length){await this.buffer(missing[cursor++]);completed++;report('loading');}}));
        const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
        this.preloaded=new Set(names);this.trimCache(this.preloaded);report('complete');return names;
      }catch(error){report('error',error);throw error;}
    }
    play(note,{velocity=80,id='voice-'+(++this.serial),when=this.context?.currentTime,duration}={}) {
      if (!this.master) throw Error('Call ready and preload before play');
      const sample=selectSample(note,velocity),entry=this.cache.get(sample.name),ctx=this.context;
      if (!entry) throw Error('Call preload before play: '+sample.name);
      if (!Number.isFinite(when) || when<ctx.currentTime) when=ctx.currentTime;
      if (duration!==undefined && (!Number.isFinite(duration)||duration<=0)) throw Error('duration must be positive seconds');
      if (this.voices.has(id)) this.cancel(this.voices.get(id));
      const source=ctx.createBufferSource(),env=ctx.createGain();source.buffer=entry.buffer;
      source.playbackRate.value=2**((sample.midi-sample.root)/12+(this.tuning==='retuned'?sample.cents:0)/1200);
      env.gain.setValueAtTime((velocity/127)**.73,when);source.connect(env);env.connect(this.master);
      const voice={id,source,env,sample,when,released:false,cancelled:false};this.voices.set(id,voice);
      source.onended=()=>{source.disconnect();env.disconnect();if(this.voices.get(id)===voice)this.voices.delete(id);};
      source.start(when);
      if(duration!==undefined)this.fade(voice,when+duration);
      this.cache.delete(sample.name);this.cache.set(sample.name,entry);this.trimCache(this.preloaded);
      return voice;
    }
    fade(voice,when=this.context.currentTime) {
      const end=voice.sample.midi>=95?4:voice.sample.midi>=89?3:.3;
      voice.env.gain.cancelAndHoldAtTime(when);voice.env.gain.setTargetAtTime(.00001,when,end/5);
      voice.source.stop(when+end);
    }
    release(voice) {
      if(typeof voice==='string')voice=this.voices.get(voice);
      if(!voice||voice.released||voice.cancelled)return;
      voice.released=true;
      if(voice.when>this.context.currentTime){this.cancel(voice);return;}
      if(!this.pedal)this.fade(voice);
    }
    cancel(voice) {voice.cancelled=true;const now=this.context.currentTime;voice.env.gain.cancelAndHoldAtTime(now);if(voice.when>now){voice.env.gain.setValueAtTime(0,now);try{voice.source.stop(now);}catch{}}else{voice.env.gain.setTargetAtTime(.00001,now,.004);try{voice.source.stop(now+.025);}catch{}}this.voices.delete(voice.id);}
    stopAll() {if(!this.context)return;for(const voice of this.voices.values())this.cancel(voice);this.pedal=false;}
    setPedal(down) {this.pedal=!!down;if(!this.pedal)for(const voice of this.voices.values())if(voice.released&&!voice.cancelled)this.fade(voice);}
    setVolume(value) {if(!Number.isFinite(value)||value<0||value>1)throw Error('Volume must be 0–1');this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.35,this.context.currentTime,.02);}
  }
  root.SalamanderSamples={register};root.SalamanderAudio=SalamanderAudio;
  if(typeof module!=='undefined')module.exports={SalamanderAudio,selectSample,midi};
})(typeof globalThis!=='undefined'?globalThis:this);
