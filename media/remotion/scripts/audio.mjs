import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync, readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const useFlite = process.argv.includes('--flite');
const tool = process.env.SKILLYT_VOICE_TOOL;
const rate = 24000;
const story = JSON.parse(readFileSync('src/story.json', 'utf8'));
const names = {Trailer:'Cinematic Trailer', Explainer:'How Skill-YT Works', Vertical:'Portrait Short'};
mkdirSync('public/audio', {recursive:true});
mkdirSync('../production/captions', {recursive:true});
let tts;
if (!useFlite) {
  if (!tool) throw new Error('Set SKILLYT_VOICE_TOOL to the directory containing kokoro-js.');
  const lookup = createRequire(pathToFileURL(resolve(tool, 'package.json')));
  const {KokoroTTS} = await import(pathToFileURL(lookup.resolve('kokoro-js')).href);
  tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {dtype:'q8',device:'cpu'});
}
const speech = async (line) => {
  if (!useFlite) {
    const take = await tts.generate(line, {voice:'af_heart',speed:1});
    return take.audio;
  }
  const file = 'public/audio/flite-input.txt';
  writeFileSync(file,line);
  try {
    const output = execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','flite=voice=slt:textfile='+file,'-ar',String(rate),'-c:a','pcm_f32le','-f','f32le','pipe:1']);
    return new Float32Array(output.buffer.slice(output.byteOffset,output.byteOffset+output.byteLength));
  } finally {unlinkSync(file);}
};
const tc = (time,full=false) => {
  const m = Math.floor(time/60);
  const s = Math.floor(time%60);
  return (full?'00:':'') + String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+
    (full?','+String(Math.round(time*1000)%1000).padStart(3,'0'):'');
};
const pages = (text, limit) => {
  const groups = [];
  let words = text.split(' ');
  while (words.join(' ').length > limit) {
    const remaining = words.join(' ').length;
    const target = Math.ceil(remaining / Math.ceil(remaining / limit));
    let boundary = 1;
    while (boundary < words.length - 1 && words.slice(0,boundary+1).join(' ').length <= target+5) boundary++;
    groups.push(words.slice(0,boundary).join(' '));
    words = words.slice(boundary);
  }
  groups.push(words.join(' '));
  return groups;
};
const fitSpeech = (samples, speed) => {
  if (speed <= 1) return samples;
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
  const out = execFileSync('ffmpeg', ['-v','error','-f','f32le','-ar',String(rate),'-ac','1','-i','pipe:0',
    '-af','atempo='+speed.toFixed(6),'-f','f32le','pipe:1'], {input:data,maxBuffer:8*1024*1024});
  return new Float32Array(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength));
};
const saveWav = (file,data) => {
  const wav = Buffer.alloc(44+data.length*2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate*2,28); wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34);
  wav.write('data',36); wav.writeUInt32LE(data.length*2,40);
  for(let i=0;i<data.length;i++) wav.writeInt16LE(Math.round(Math.max(-.97,Math.min(.97,data[i]))*32767),44+i*2);
  writeFileSync(file,wav);
};
const result={};
let scripts='# Narration and scene timing\n\nEnglish voiceover. Timecodes are elapsed time.\n';
for (const [id, beats] of Object.entries(story)) {
  let start=0;
  const length=beats.reduce((v,b)=>v+b.d,0);
  const mix=new Float32Array(length*rate);
  const captions=[];
  scripts+='\n## '+names[id]+'\n';
  for (const beat of beats) {
    const sentences=beat.voice.match(/[^.?!]+[.?!]+|[^.?!]+$/g).map(s=>s.trim());
    const takes=[];
    for(const sentence of sentences) takes.push(await speech(sentence));
    const gap=.13;
    const total=takes.reduce((v,s)=>v+s.length/rate,0)+gap*(takes.length-1);
    const speed=Math.max(1,total/(beat.d-.55));
    let at=start+.25;
    for (const [index, take] of takes.entries()) {
      const samples=fitSpeech(take,speed);
      const span=samples.length/rate;
      let peak=0;
      for(const value of samples) peak=Math.max(peak,Math.abs(value));
      const gain=Math.min(.78/Math.max(peak,.1),2);
      const begin=Math.round(at*rate);
      for(let j=0;j<samples.length;j++){
        mix[begin+j]+=gain*samples[j]*Math.min(1,j/100,(samples.length-j)/100);
      }
      const lines=pages(sentences[index],id==='Vertical'?52:77);
      const characters=lines.reduce((v,line)=>v+line.length,0);
      let cue=at;
      for(const line of lines){
        const end=cue+span*line.length/characters;
        captions.push({text:line,startMs:Math.round(cue*1000),endMs:Math.round(end*1000),timestampMs:null,confidence:null});
        cue=end;
      }
      at+=span+gap/speed;
    }
    if (at > start + beat.d + gap) throw new Error('Narration overflow: '+beat.title);
    for(let j=0;j<beat.d*rate;j++){
      const t=j/rate;
      const global=start+t;
      const voiceHere=global>start+.2&&global<at;
      const base=2*Math.PI*global;
      const entry=Math.min(1,t*2,(length-global)*2);
      const motion=.65+.35*Math.sin(base*.12+1);
      const pulse=Math.exp(-((t-.2)**2)*13);
      const theme=.014*Math.sin(base*55)+.011*Math.sin(base*82.41+.3*Math.sin(base*.18))+.007*Math.sin(base*110+.4*Math.sin(base*.09));
      const accent=(beat.kind==='gate'? .030:.021)*pulse*Math.sin(2*Math.PI*(66*t+8*Math.sin(t*.9)))+.011*pulse*Math.sin(2*Math.PI*660*t);
      mix[start*rate+j]+=entry*(theme*motion*(voiceHere?.55:1)+accent);
    }
    scripts+='\n### '+tc(start)+'–'+tc(start+beat.d)+' · '+beat.title+'\n\n'+beat.voice+'\n';
    start+=beat.d;
    console.log(id,tc(start), 'voice rendered',speed.toFixed(2)+'x');
  }
  saveWav('public/audio/'+id+'.wav',mix);
  const srt=captions.map((cue,i)=>[i+1,tc(cue.startMs/1000,true)+' --> '+tc(cue.endMs/1000,true),cue.text+'\n'].join('\n')).join('\n');
  writeFileSync('../production/captions/Skill-YT-'+id+'.srt',srt);
  result[id]=captions;
  writeFileSync('src/audio-timing.json',JSON.stringify(result,null,2)+'\n');
}
writeFileSync('../production/NARRATION.md',scripts);
console.log(useFlite?'Voice: CMU Flite slt':'Voice: Kokoro af_heart');
