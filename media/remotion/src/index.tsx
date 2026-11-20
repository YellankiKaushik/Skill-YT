import React from 'react';
import {AbsoluteFill, Composition, Sequence, Still, getStaticFiles, staticFile, registerRoot, useCurrentFrame, useRemotionEnvironment, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/500.css';
import {World, Graphic, Emblem, cyan, mint, amber, red, white, muted, ramp, inOut} from './visuals';
import story from './story.json';
import captions from './audio-timing.json';
import './style.css';

type ID=keyof typeof story;
type Beat=(typeof story)[ID][number];
type Cue={text:string;startMs:number;endMs:number;timestampMs:number|null;confidence:number|null};
const cuesById:Partial<Record<ID,Cue[]>>=captions;

const Header=({beat,p}:{beat:Beat;p:boolean})=>{
  const {fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const reveal=inOut(ramp(t,.08,.83));
  const accent=beat.kind==='gate'?red:beat.kind==='close'||beat.kind==='draft'?mint:cyan;
  return <div className={'shot-head '+(beat.kind==='close'?'closing ':'')+(p?'portrait-head':'')} style={{opacity:reveal,translate:'0 '+(23*(1-reveal))+'px'}}>
    <div className="kicker" style={{color:accent}}><span style={{background:accent}}/>{beat.k}</div>
    <h1>{beat.kind==='close'?<>Secure Inbox<br/>AI Agent</>:beat.title}</h1>
    <div className="subhead">{beat.sub}</div>
    {beat.kind==='close'&&<div className="address">
      <span className="address-owner">GITHUB.COM / YELLANKIKAUSHIK /</span>
      <span className="address-name">Skill-YT</span>
      {beat.k.startsWith('08')&&<span className="address-owner">RELEASE V1.1.0</span>}
    </div>}
  </div>;
};

const Shot=({beat,p}:{beat:Beat;p:boolean})=>{
  const {fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const arrival=inOut(ramp(t,0,.77));
  const focus=inOut(ramp(t,.4,beat.d-.12));
  const accent=beat.kind==='gate'?red:beat.kind==='draft'?amber:cyan;
  const track=beat.kind==='gate'?-45:beat.kind==='inbox'?67:beat.kind==='recovery'?-24:24;
  const x=(1-arrival)*(p?0:34)+(focus-.5)*(p?-8:track);
  const y=(1-arrival)*(p?46:24)+(focus-.5)*(p?-14:-10);
  return <AbsoluteFill>
    <div className="shot-glow" style={{background:'radial-gradient(ellipse at '+(p?49:63+focus*9)+'% 51%, '+accent+'21, transparent 58%)'}}/>
    <div className={'stage '+(p?'portrait-stage':'')+(beat.kind==='close'?' close-stage':'')} style={{opacity:.42+.58*arrival,translate:x+'px '+y+'px',scale:(.943+.052*arrival+.026*focus)}}>
      <Graphic kind={beat.kind} detail={'detail' in beat?beat.detail:undefined} d={beat.d} p={p}/>
    </div>
    <Header beat={beat} p={p}/>
    {t<.72&&<div className="sweep" style={{opacity:.39*(1-ramp(t,.01,.72)),translate:(p?'0 '+(-280+1050*ramp(t,0,.72))+'px':(-1180+2300*ramp(t,0,.72))+'px 0')}}/>}
  </AbsoluteFill>;
};
const CaptionBar=({id,p,texts}:{id:ID;p:boolean;texts:Cue[]})=>{
  const {fps}=useVideoConfig();
  const t=useCurrentFrame()*1000/fps;
  const cue=texts.find(c=>c.startMs<=t && c.endMs>t);
  if(!cue)return null;
  return <div className={'caption '+(p?'portrait-caption':'')} aria-label={id+' captions'}>
    <span>{cue.text}</span>
  </div>;
};
const Frame=({id,p,duration}:{id:ID;p:boolean;duration:number})=>{
  const {fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const label=id==='Explainer'?'WALKTHROUGH':id==='Vertical'?'PORTRAIT SHORT':'CINEMATIC TRAILER';
  return <AbsoluteFill style={{pointerEvents:'none'}}>
    <div className={'topline '+(p?'portrait-line':'')}><span><i/> SKILL-YT</span><span>{label}</span></div>
    <div className={'bottomline '+(p?'portrait-line':'')}><span>SYNTHETIC DATA</span><span>{String(Math.floor(t/60)).padStart(2,'0')}:{String(Math.floor(t%60)).padStart(2,'0')}</span></div>
    <div className={'progress '+(p?'portrait-progress':'')}><div style={{width:(100*t/duration)+'%'}}/></div>
  </AbsoluteFill>;
};
const enabled=(id:ID)=>Boolean(cuesById[id]?.length);
const duration=(id:ID)=>story[id].reduce((sum,beat)=>sum+beat.d,0);
const Film=({id,sound=true,burnCaptions=true}:{id:ID;sound?:boolean;burnCaptions?:boolean})=>{
  const {fps,height,width}=useVideoConfig();
  const {isStudio}=useRemotionEnvironment();
  const p=height>width;
  const soundtrack='audio/'+id+'.wav';
  const hasSoundtrack=!isStudio||getStaticFiles().some(file=>file.name===soundtrack);
  let at=0;
  return <AbsoluteFill className="film">
    <World portrait={p}/>
    {story[id].map((beat,index)=>{
      const from=at*fps;
      at+=beat.d;
      return <Sequence key={beat.title} name={String(index+1).padStart(2,'0')+' '+beat.title} from={from} durationInFrames={beat.d*fps}>
        <Shot beat={beat} p={p}/>
      </Sequence>;
    })}
    <Frame id={id} p={p} duration={duration(id)}/>
    {sound&&enabled(id)&&hasSoundtrack&&<Audio src={staticFile(soundtrack)}/>}
    {burnCaptions&&<CaptionBar id={id} p={p} texts={cuesById[id]??[]}/>}
  </AbsoluteFill>;
};
const Poster=()=> <AbsoluteFill className="film">
  <World portrait={false}/>
  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 77% 50%, #13658755, transparent 47%)'}}/>
  <svg width={1280} height={720} viewBox="0 0 1280 720" style={{position:'absolute',inset:0}}>
    <path d="M100 546L605 546L775 415M1280 186H1020L921 274M1160 562L1064 545L1009 492" stroke="#3a82a0" opacity=".6" fill="none"/>
    <Emblem x={945} y={365} s={.9} t={2}/>
  </svg>
  <div style={{position:'absolute',left:80,top:122,width:615}}>
    <div className="kicker" style={{color:cyan}}><span style={{background:cyan}}/> OPEN SOURCE / SKILL-YT</div>
    <h1 style={{fontSize:112,lineHeight:.86,letterSpacing:-8,margin:'30px 0 26px'}}>Secure<br/>Inbox</h1>
    <p style={{color:mint,fontSize:34,lineHeight:1.18,letterSpacing:-.8,margin:0}}>AI drafts.<br/>Humans decide.</p>
  </div>
</AbsoluteFill>;
const defaultMedia={sound:true,burnCaptions:true};
const Root=()=> <>
  <Composition id="Skill-YT-Trailer" component={Film} defaultProps={{id:'Trailer' as ID,...defaultMedia}} durationInFrames={duration('Trailer')*30} fps={30} width={1920} height={1080}/>
  <Composition id="Skill-YT-Explainer" component={Film} defaultProps={{id:'Explainer' as ID,...defaultMedia}} durationInFrames={duration('Explainer')*30} fps={30} width={1920} height={1080}/>
  <Composition id="Skill-YT-Vertical" component={Film} defaultProps={{id:'Vertical' as ID,...defaultMedia}} durationInFrames={duration('Vertical')*30} fps={30} width={1080} height={1920}/>
  <Still id="Skill-YT-Poster" component={Poster} width={1280} height={720}/>
</>;
registerRoot(Root);
