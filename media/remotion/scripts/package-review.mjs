import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';

const root = resolve(process.env.SKILLYT_EXPORT_DIR || '../exports');
const story = JSON.parse(readFileSync('src/story.json','utf8'));
const captions = JSON.parse(readFileSync('src/audio-timing.json','utf8'));
mkdirSync(join(root,'captions'), {recursive:true});
const normalize = text=>text.replace(/\s+/g,' ').trim();
const tc = (ms, vtt=false)=>{
  const value=Math.round(ms);
  const h=Math.floor(value/3600000), m=Math.floor(value/60000)%60, s=Math.floor(value/1000)%60;
  return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')+(vtt?'.':',')+String(value%1000).padStart(3,'0');
};
const qa = {};
for(const [id,beats] of Object.entries(story)){
  const cues=captions[id];
  const duration=beats.reduce((sum,beat)=>sum+beat.d,0);
  if(normalize(cues.map(c=>c.text).join(' '))!==normalize(beats.map(b=>b.voice).join(' ')))throw new Error('Caption/script mismatch: '+id);
  let last=0;
  for(const cue of cues){
    if(cue.startMs<last||cue.endMs<=cue.startMs||cue.endMs>duration*1000)throw new Error('Invalid cue: '+JSON.stringify(cue));
    if(cue.text.trim().split(/\s+/).length===1)throw new Error('One-word orphan: '+cue.text);
    last=cue.endMs;
  }
  // Overlay switches on the first output frame at or after each JSON boundary.
  const frameCues=cues.map(c=>({...c,startMs:Math.ceil(c.startMs*30/1000)*1000/30,endMs:Math.ceil(c.endMs*30/1000)*1000/30}));
  const srt=frameCues.map((c,i)=>[i+1,tc(c.startMs)+' --> '+tc(c.endMs),c.text+'\n'].join('\n')).join('\n');
  const vtt='WEBVTT\n\n'+frameCues.map(c=>tc(c.startMs,true)+' --> '+tc(c.endMs,true)+'\n'+c.text+'\n').join('\n');
  writeFileSync(join(root,'captions','Skill-YT-'+id+'.srt'),srt);
  writeFileSync(join(root,'captions','Skill-YT-'+id+'.vtt'),vtt);
  writeFileSync('../production/captions/Skill-YT-'+id+'.srt',srt);
  writeFileSync('../production/captions/Skill-YT-'+id+'.vtt',vtt);
  let at=0;
  const scenes=beats.map((b,i)=>{const scene={scene:i+1,startSeconds:at,endSeconds:at+b.d,startFrame:at*30,endFrameExclusive:(at+b.d)*30,kind:b.kind,title:b.title,narration:b.voice};at+=b.d;return scene;});
  writeFileSync(join(root,id+'-scenes.json'),JSON.stringify(scenes,null,2)+'\n');
  qa[id]={scenes:beats.length,cues:cues.length,scriptMatches:true,oneWordOrphans:0,durationSeconds:duration,
    maxCaptionCharacters:Math.max(...cues.map(c=>c.text.length)),
    maxCharactersPerSecond:+Math.max(...cues.map(c=>c.text.length/((c.endMs-c.startMs)/1000))).toFixed(1),
    frameRounding:'ceil to first visible 30fps output frame',
    alignment:'Sentence timing follows generated takes. Caption pages within each sentence use proportional character timing; no word-level forced alignment or perceptual listening claimed.'};
}
writeFileSync(join(root,'caption-inspection.json'),JSON.stringify(qa,null,2)+'\n');
copyFileSync('out/Skill-YT-Thumbnail.png',join(root,'Skill-YT-Thumbnail.png'));
copyFileSync('../production/NARRATION.md',join(root,'NARRATION.md'));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skill-YT — Review screening</title>
<style>:root{color-scheme:dark;font:16px system-ui;background:#050d18;color:#eaf7ff}body{max-width:1100px;margin:50px auto;padding:0 24px}h1{font-size:clamp(32px,6vw,64px);letter-spacing:-.06em;line-height:1}p{color:#a7c3d9;line-height:1.6}small,.tag{font:12px monospace;color:#84f5c3;letter-spacing:.1em}article{margin:60px 0}video{width:100%;display:block;background:#071525;border:1px solid #27516a;border-radius:16px;box-shadow:0 20px 70px #0008}.portrait{max-width:390px}a{color:#57e8ff}h2{font-size:26px;letter-spacing:-.03em}.meta{display:flex;justify-content:space-between;gap:20px;align-items:baseline}.foot{margin:70px 0;border-top:1px solid #234259;padding-top:24px}</style>
<span class="tag">LOCAL REVIEW / ORIGINAL MOTION GRAPHICS</span><h1>AI drafts.<br>Humans decide.</h1><p>Three complete Skill-YT films. Each includes generated narration, original sound design and burned-in captions. Public distribution awaits your approval.</p>
${[['Trailer','Cinematic trailer','45 seconds · 1920 × 1080'],['Explainer','How Skill-YT works','5 minutes · 1920 × 1080'],['Vertical','Portrait short','27 seconds · 1080 × 1920']].map(([id,title,meta])=>`<article><div class="meta"><h2>${title}</h2><small>${meta}</small></div><video ${id==='Vertical'?'class="portrait"':''} controls playsinline preload="metadata" poster="Skill-YT-Thumbnail.png"><source src="Skill-YT-${id}-${id==='Vertical'?'1080x1920':'1080p'}.mp4" type="video/mp4"></video><p><a href="Skill-YT-${id}-${id==='Vertical'?'1080x1920':'1080p'}.mp4">Open MP4</a> · <a href="captions/Skill-YT-${id}.srt">SRT captions</a></p></article>`).join('')}
<div class="foot"><p>Offline synthetic demonstration. No live Gmail verification. No email sent. Defined safeguards do not establish complete prompt-injection protection or distributed exactly-once processing.</p><a href="https://github.com/YellankiKaushik/Skill-YT">github.com/YellankiKaushik/Skill-YT</a></div></html>`;
writeFileSync(join(root,'WATCH.html'),html);
writeFileSync(join(root,'OPEN-VIDEOS.cmd'),'@echo off\r\nstart "" "%~dp0WATCH.html"\r\n');
console.log(JSON.stringify(qa,null,2));
