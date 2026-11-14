import { assetUrl } from '../assets';

interface Midi {duration:number;notes:[number,number,number,number,number][]}
export interface AudioSettings {muted:boolean;volume:number;reduced:boolean}
export class Sound {
  private context:AudioContext|null=null;private master:GainNode|null=null;
  private midi:Midi|null=null;private buffers=new Map<string,AudioBuffer>();
  private started=0;private cursor=0;private timer=0;
  private voices=new Set<OscillatorNode>();
  settings:AudioSettings={muted:false,volume:.35,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  constructor(){try{const s=JSON.parse(localStorage.getItem('ancient-kingdom.settings')??'null');if(s&&typeof s.muted==='boolean'&&typeof s.volume==='number')this.settings={muted:s.muted,volume:Math.max(0,Math.min(1,s.volume)),reduced:!!s.reduced};}catch{}document.addEventListener('visibilitychange',()=>{if(document.hidden)this.context?.suspend();else if(this.context)this.context.resume().catch(()=>{});});}
  async unlock(){
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.connect(this.context.destination);this.apply();
      const assets=await Promise.allSettled([fetch(assetUrl('cave-notes.json')).then(r=>r.json()).then(v=>this.midi=v),...['step','crash'].map(name=>fetch(assetUrl(`${name}.wav`)).then(r=>r.arrayBuffer()).then(b=>this.context!.decodeAudioData(b)).then(b=>{this.buffers.set(name,b);}))]);
      if(assets.some(r=>r.status==='rejected'))console.warn('一部の音素材を読み込めませんでした。');
      this.started=this.context.currentTime+.12;this.cursor=0;this.timer=window.setInterval(()=>this.schedule(),100);
    }
    if(!document.hidden)await this.context.resume();
  }
  apply(){if(this.master)this.master.gain.value=this.settings.muted?0:this.settings.volume;try{localStorage.setItem('ancient-kingdom.settings',JSON.stringify(this.settings));}catch{}}
  private schedule(){const c=this.context,m=this.midi;if(!c||!m||c.state!=='running')return;
    const elapsed=c.currentTime-this.started;
    if(elapsed>m.duration){this.started+=m.duration;this.cursor=0;}
    while(this.cursor<m.notes.length&&m.notes[this.cursor][0]<c.currentTime-this.started+.25){const [at,dur,n,v,p]=m.notes[this.cursor++];if(this.started+at<c.currentTime-.05)continue;this.note(n,this.started+at,Math.min(2,dur),v/127*.035,p===35?'triangle':p===78?'sine':'triangle');}
  }
  private note(n:number,at:number,duration:number,volume:number,type:OscillatorType){const c=this.context;if(!c||!this.master)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(n-69)/12);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+.015);g.gain.exponentialRampToValueAtTime(.001,at+Math.max(.03,duration));o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.04);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};}
  play(name:'step'|'crash'|'confirm'|'attack'|'heal'|'victory'){
    const c=this.context;if(!c||!this.master||c.state!=='running')return;
    const buffer=this.buffers.get(name);if(buffer){const source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;gain.gain.value=name==='step'?.22:.5;source.connect(gain);gain.connect(this.master);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};return;}
    const pitches=name==='victory'?[60,64,67,72]:name==='heal'?[67,72]:name==='attack'?[40,32]:[60];pitches.forEach((n,i)=>this.note(n,c.currentTime+i*.08,.12,.08,'triangle'));
  }
  dispose(){clearInterval(this.timer);this.voices.forEach(v=>v.stop());this.context?.close();}
  diagnostics(){return {state:this.context?.state??'locked',notes:this.midi?.notes.length??0,decodedWav:this.buffers.size,activeVoices:this.voices.size,muted:this.settings.muted,volume:this.settings.volume};}
}
