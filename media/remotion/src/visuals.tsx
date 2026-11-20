import type {ReactNode} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const cyan='#57e8ff', mint='#84f5c3', amber='#ffcf81', red='#ff788b', white='#ecf7ff', muted='#a3bccf';
const mono='IBM Plex Mono, monospace';
const display='Space Grotesk Variable, sans-serif';
export const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export const ramp=(t:number,a:number,b:number)=>interpolate(t,[a,b],[0,1],clamp);
export const inOut=(t:number)=>t*t*(3-2*t);
const modulo=(t:number,n:number)=>((t%n)+n)%n;

type SymbolName='mail'|'scan'|'policy'|'file'|'person'|'stop'|'check'|'code'|'stack'|'clock'|'link';
const paths:Record<SymbolName,string>={
  mail:'M5 10H43V38H5Z M5 11L24 26L43 11 M5 38L18 24 M43 38L30 24',
  scan:'M18 6H6V18 M30 6H42V18 M6 30V42H18 M42 30V42H30 M11 24H37 M24 17V31',
  policy:'M12 7H36V41H12Z M17 17H31 M17 24H31 M17 31H25 M21 7V4H27V7',
  file:'M12 5H31L38 12V43H12Z M31 5V13H38 M18 22H32 M18 29H32 M18 36H26',
  person:'M31 16A7 7 0 1 1 17 16A7 7 0 1 1 31 16 M10 39V35C10 25 38 25 38 35V39',
  stop:'M15 7H33L41 15V33L33 41H15L7 33V15Z M16 16L32 32 M32 16L16 32',
  check:'M8 25L19 36L40 13',
  code:'M15 12L5 24L15 36 M33 12L43 24L33 36 M28 8L20 40',
  stack:'M5 17L24 7L43 17L24 27Z M5 24L24 34L43 24 M5 31L24 41L43 31',
  clock:'M24 7A17 17 0 1 1 24 41A17 17 0 1 1 24 7 M24 13V24L32 29',
  link:'M20 17L24 13A8 8 0 0 1 35 24L30 29 M28 31L24 35A8 8 0 0 1 13 24L18 19 M18 30L30 18'
};
export const Glyph=({x=0,y=0,size=48,name,c=cyan}:{x?:number;y?:number;size?:number;name:SymbolName;c?:string})=><g transform={'translate('+x+' '+y+') scale('+size/48+')'}>
  <path d={paths[name]} fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"/>
</g>;
const Label=({x,y,children,c=muted,size=22,center=false}:{x:number;y:number;children:ReactNode;c?:string;size?:number;center?:boolean})=><text x={x} y={y} fill={c} fontFamily={mono} fontSize={size} fontWeight={500} textAnchor={center?'middle':'start'}>{children}</text>;
const Txt=({x,y,children,c=white,size=42,center=false}:{x:number;y:number;children:ReactNode;c?:string;size?:number;center?:boolean})=><text x={x} y={y} fill={c} fontFamily={display} fontSize={size} fontWeight={650} letterSpacing={-.9} textAnchor={center?'middle':'start'}>{children}</text>;

export const World=({portrait}:{portrait:boolean})=>{
  const {fps,width,height}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const horizon=height*(portrait?.48:.46);
  const van=width*(.58+.08*Math.sin(t*.042));
  const speed=t*.23;
  return <svg width={width} height={height} style={{position:'absolute',inset:0}} aria-hidden>
    <defs><radialGradient id="air"><stop stopColor="#123653"/><stop offset=".56" stopColor="#07182a"/><stop offset="1" stopColor="#050a13"/></radialGradient>
      <linearGradient id="gridfade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#15364b" stopOpacity="0"/><stop offset="1" stopColor="#2a526a" stopOpacity=".72"/></linearGradient>
      <pattern id="dot" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#6bc3e8" opacity=".21"/></pattern>
    </defs>
    <rect width={width} height={height} fill="url(#air)"/>
    <rect width={width} height={horizon} fill="url(#dot)"/>
    <path d={Array.from({length:30},(_,i)=>'M'+van+' '+horizon+'L'+((i-5)*width/19)+' '+height).join('')} fill="none" stroke="url(#gridfade)"/>
    {Array.from({length:17},(_,i)=>{
      const q=modulo(i/17+speed,1);
      const y=horizon+q*q*(height-horizon);
      return <path key={i} d={'M0 '+y+'H'+width} stroke="#3c7795" opacity={.07+.16*q}/>;
    })}
    {Array.from({length:32},(_,i)=>{
      const x=modulo(i*173.879+t*(10+i%6),width+70)-35, y=modulo(i*113.39+(i%4-1.5)*t*5,height);
      return <circle key={i} cx={x} cy={y} r={i%5===0?2:1} fill={i%3===0?mint:cyan} opacity={.16+.14*Math.sin(t+i)}/>;
    })}
    <path d={'M0 '+(horizon+2)+'H'+width} stroke="#4ad7ff" opacity=".14"/>
   </svg>;
};

const Packet=({x,y,s=1,c=cyan,a=1}:{x:number;y:number;s?:number;c?:string;a?:number})=><g transform={'translate('+x+' '+y+') scale('+s+')'} opacity={a}>
  <path d="M-104 0H-36" stroke={c} strokeOpacity=".28" strokeWidth="3"/>
  <rect x="-28" y="-19" width="56" height="39" rx="7" fill="#102842" stroke={c} strokeWidth="2"/>
  <path d="M-20 -11L0 3L20 -11" fill="none" stroke={c} strokeWidth="2"/>
</g>;

const Mail=({x,y,s=1,r=0,c=cyan,id,subject,lines,badge,t=0}:{x:number;y:number;s?:number;r?:number;c?:string;id:string;subject:string;lines:string[];badge?:string;t?:number})=>{
  const scan=modulo(t/3.4,1);
  return <g transform={'translate('+x+' '+y+') rotate('+r+') scale('+s+')'}>
    <rect width="502" height="280" rx="26" x="14" y="24" fill="#020812" opacity=".78"/>
    <rect width="502" height="280" rx="26" fill="#0a1829" stroke={c} strokeWidth="1.7" strokeOpacity=".84"/>
    <path d="M2 74H500" stroke={c} strokeOpacity=".27"/>
    <Glyph x={24} y={15} name="mail" size={44} c={c}/>
    <Label x={79} y={48} c={c}>{id}</Label>
    <circle cx="458" cy="37" r="4" fill={c}/>
    <path d="M420 37H443" stroke={c} opacity=".4" strokeWidth="2"/>
    <Txt x={29} y={127} size={subject.length>20?34:42}>{subject}</Txt>
    {lines.map((line,i)=><Label key={line} x={30} y={169+i*34} size={21} c={white}>{line}</Label>)}
    <path d={'M30 '+(82+151*scan)+'H472'} stroke={c} strokeOpacity=".09"/>
    {badge&&<Label x={30} y={251} c={c} size={18}>{badge}</Label>}
  </g>;
};
const Chip=({x,y,c=cyan,name,tag,active=0,size=228}:{x:number;y:number;c?:string;name:SymbolName;tag:string;active?:number;size?:number})=><g transform={'translate('+x+' '+y+')'}>
  <path d={'M'+(-size/2+18)+' -70 H'+(size/2-18)+'L'+size/2+' -52V80H'+(-size/2)+'V-52Z'} fill="#04101c" stroke="#0a2639" strokeWidth="14" transform="translate(7 14)"/>
  <path d={'M'+(-size/2+18)+' -70 H'+(size/2-18)+'L'+size/2+' -52V71H'+(-size/2)+'V-52Z'} fill="#0d2136" stroke={c} strokeOpacity={.46+.5*active} strokeWidth="2"/>
  <path d="M-25 -69H25" stroke={c} strokeWidth={3+4*active}/>
  <Glyph x={-30} y={-46} size={60} name={name} c={c}/>
  <Label x={0} y={48} center c={c} size={21}>{tag}</Label>
  <circle cx={-size/2+14} cy={56} r="3" fill={c} opacity={.32+.68*active}/>
</g>;
const Rail=({d,c=cyan,on=1}:{d:string;c?:string;on?:number})=><g>
  <path d={d} stroke={c} strokeWidth="11" opacity=".08" fill="none"/>
  <path d={d} stroke={c} strokeWidth="2" opacity=".32" fill="none"/>
  <path d={d} pathLength="1" strokeDasharray={'.10 1'} strokeDashoffset={-on} stroke={c} strokeWidth="4" strokeLinecap="round" fill="none"/>
</g>;
const loc=(a:[number,number],b:[number,number],q:number):[number,number]=>[a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q];
const railPath=(a:[number,number],b:[number,number])=>'M'+a.join(' ')+'L'+b.join(' ');

type Scene={t:number; fps:number; p:boolean; detail?:string; d:number};
const Stage=({children,p}:{children:ReactNode;p:boolean})=><svg width="100%" height="100%" viewBox={p?'0 0 940 1030':'0 0 1720 610'} style={{overflow:'visible'}}>{children}</svg>;

const Inbox=({t,fps,p,d}:Scene)=>{
  const q=ramp(t,0,Math.min(5,d));
  const springIn=spring({frame:Math.round(t*fps),fps,config:{damping:27,stiffness:62}});
  const x=p?228:896,y=p?330:143;
  const van=p?[470,430]:[1070,270];
  return <g>
    {[0,1,2,3,4,5,6,7,8].map(i=>{
      const end=[(i%5)*(p?230:420)-10,Math.floor(i/5)*(p?900:510)+40];
      return <g key={i}><Rail d={'M'+van.join(' ')+'L'+end.join(' ')} on={modulo(t*.39+i*.13,1)}/>
        {[0,1,2].map(j=>{const f=modulo(t*(.25+i*.009)+j*.33+i*.15,1);const g=f*f;return <Packet key={j} x={end[0]+(van[0]-end[0])*g} y={end[1]+(van[1]-end[1])*g} s={.82-g*.65} a={.4+g*.46} c={i%4===0?amber:cyan}/>})}
      </g>;
    })}
    <circle cx={van[0]} cy={van[1]} r={155+14*Math.sin(t*2)} stroke={cyan} fill="none" opacity=".28"/>
    <circle cx={van[0]} cy={van[1]} r="211" stroke={cyan} fill="none" opacity=".1" strokeDasharray="8 13"/>
    <Mail x={x+(1-springIn)*115-26*q} y={y+20*Math.sin(t*.6)} s={(p?.97:1.2)*(0.69+.31*springIn+.08*q)} r={-7+3*q} id="SYNTHETIC / INCOMING" subject="Question" lines={['Can you share more','about your work?']} badge="MESSAGE DATA" c={cyan} t={t}/>
    <Label x={p?70:95} y={p?845:472} c={cyan} size={p?28:23}>INCOMING SIGNAL</Label>
    <path d={p?'M70 879H650':'M95 500H630'} stroke={cyan} strokeOpacity=".4" strokeDasharray="3 8" strokeWidth="2"/>
  </g>;
};

const Gate=({t,p,d}:Scene)=>{
  const q=inOut(ramp(t,.25,Math.min(2.65,d*.5)));
  const hit=ramp(t,1.45,2.15);
  const pulse=hit*Math.exp(-modulo(Math.max(0,t-2.15),3)*1.45);
  const cx=p?470:900, cy=p?570:270;
  const tx=p?226-40*hit:157+122*q-40*hit;
  const ty=p?160+90*q:161;
  return <g>
    <Rail d={p?'M470 115V950':'M88 282H1630'} c={red} on={Math.min(.49,q*.55)}/>
    <g transform={'translate('+cx+' '+cy+') rotate('+(p?90:0)+')'}>
      {[0,1,2,3].map(i=><path key={i} d={'M'+(14*i-25)+' -208L'+(14*i+25)+' -145V146L'+(14*i-25)+' 208L'+(14*i-70)+' 145V-145Z'}
        fill="#103654" fillOpacity=".21" stroke={i===3?red:cyan} opacity={.4+i*.13} strokeWidth={i===3?3+2*pulse:2}/>)}
      <path d="M10 -144V144" stroke={red} opacity={.43+.45*pulse} strokeWidth="5" strokeDasharray="7 12"/>
      {Array.from({length:18},(_,i)=>{
        const wave=modulo(t*.66+i*.057,1);
        return <circle key={i} cx={-35-wave*(64+i%5*19)} cy={(i-9)*17+24*Math.sin(t+i)*wave} r={2+i%3} fill={red} opacity={hit*(1-wave)*.7}/>;
      })}
    </g>
    <Mail x={tx} y={ty} s={p?1.01:1.03} r={-7+q*5-2*pulse} id="DEMO-3 / SUSPICIOUS" subject="Urgent" lines={['Verify your account.','Instruction override detected.']} c={red} t={t}/>
    <g opacity={hit} transform={'translate('+(p?470:1290)+' '+(p?808:272)+')'}>
      <Chip x={0} y={0} name="person" c={amber} tag="HUMAN REVIEW" active={pulse} size={282}/>
      <Label x={0} y={115} c={amber} center size={p?27:21}>NO DRAFT CREATED</Label>
    </g>
  </g>;
};
const Pipeline=({t,p,d}:Scene)=>{
  const points:[number,number][]=p?[[470,120],[470,322],[470,526],[244,820],[693,820]]:[[204,270],[530,270],[875,270],[1390,134],[1390,416]];
  const colors=[cyan,cyan,cyan,mint,amber];
  const symbols:SymbolName[]=['mail','scan','policy','file','person'];
  const names=['READ','CLASSIFY','POLICY','DRAFT','REVIEW'];
  const cycle=Math.max(2.6,Math.min(5,d*.48));
  const phase=modulo((t+.1)/cycle,1)*3;
  const state=Math.floor(phase);
  const q=inOut(phase%1);
  const branch=Math.floor((t+.1)/cycle)%2===0?3:4;
  const links=[[0,1],[1,2],[2,3],[2,4]];
  const [x,y]=loc(points[state],points[state===2?branch:state+1],q);
  return <g>
    {links.map(([a,b])=><Rail key={b} d={railPath(points[a],points[b])} c={colors[b]} on={a===state?q:.015}/>)}
    {points.map(([x,y],i)=><g key={i} opacity={.42+.58*ramp(t,i*.13,.9+i*.13)}>
      <Chip x={x} y={y} name={symbols[i]} c={colors[i]} tag={names[i]} active={state===i?.87:i===branch&&state===2?q:.09} size={p?246:226}/>
      <Label x={x} y={y-100} c={colors[i]} size={p?27:20} center>{i>2?'↳':String(i+1).padStart(2,'0')}</Label>
    </g>)}
    <Packet x={x} y={y} s={.9} c={colors[state===2?branch:state]} a={Math.sin(q*Math.PI)*.88}/>
    <Label x={p?470:850} y={p?982:570} center c={muted} size={p?25:22}>RULES IN CODE · HUMAN DECISION AT THE EDGE</Label>
  </g>;
};
const Draft=({t,p}:Scene)=>{
  const q=inOut(ramp(t,.2,1.55));
  const show=ramp(t,1,2.3);
  const center=p?470:1340;
  const yc=p?742:257;
  return <g>
    <Rail d={p?'M470 90V878':'M204 281H1460'} c={mint} on={modulo(t*.31,1)*.76}/>
    <g opacity={.2+q*.8}>
      <Mail x={p?199:270} y={(p?162:143)+(1-q)*100} s={p?1.09:1.24} r={-6+q*4}
        c={mint} id="DRAFT / ACKNOWLEDGMENT" subject="Thanks for reaching out." lines={['We have received your message','and will review it.']} badge="AWAITING HUMAN DECISION" t={t}/>
    </g>
    <g opacity={show}>
      <path d={p?'M128 546H815':'M1103 85V483'} stroke={amber} opacity=".44" strokeWidth="18"/>
      <path d={p?'M96 546H848':'M1103 51V517'} stroke={amber} strokeDasharray="6 15" strokeWidth="3"/>
      <Chip x={center} y={yc} name="person" c={amber} tag="HUMAN REVIEW" size={p?324:285} active={.5+.25*Math.sin(t*2)}/>
      <Glyph x={center-22} y={yc+107} size={44} name="stop" c={red}/>
      <Label x={center} y={yc+187} center c={red} size={p?30:25}>NO SEND OPERATION</Label>
    </g>
  </g>;
};
const Case=({t,p,detail}:Scene)=>{
  const cases={
    normal:{id:'DEMO-1 / GENERAL',subject:'Question',lines:['Can you share more','about your work?'],color:mint,term:'drafted',rule:'ELIGIBLE ACKNOWLEDGMENT',state:'IN-MEMORY DRAFT',glyph:'file'},
    sponsor:{id:'DEMO-2 / SPONSORSHIP',subject:'Sponsorship',lines:['We’d like a sponsorship','collaboration.'],color:amber,term:'needs_review',rule:'APPROVED TERMS / FLOOR MISSING',state:'NO DRAFT',glyph:'person'},
    attack:{id:'DEMO-3 / SUSPICIOUS',subject:'Urgent',lines:['Verify your account.','Instruction override detected.'],color:red,term:'needs_review',rule:'INJECTION PATTERN MATCHED',state:'NO DRAFT',glyph:'person'}
  } as const;
  const item=cases[detail as keyof typeof cases]??cases.normal;
  const q=inOut(ramp(t,.16,2.2));
  const show=ramp(t,2.0,3.5);
  const cx=p?470:1247,cy=p?687:246;
  return <g>
    <Rail d={p?'M460 100V885':'M120 255H1602'} c={item.color} on={modulo(t*.21,1)}/>
    <Mail x={(p?202:198)-90*(1-q)} y={p?122:132} s={p?1.08:1.19} r={-8+6*q} id={item.id} subject={item.subject} lines={[...item.lines]} c={item.color} t={t}/>
    <g opacity={show} transform={'translate(0 '+(1-show)*46+')'}>
      <Label x={cx} y={cy-114} center c={item.color}>{item.rule}</Label>
      <Chip x={cx} y={cy} name={item.glyph} tag={item.term} c={item.color} active={.52+.35*Math.sin(t*2.5)} size={315}/>
      <Label x={cx} y={cy+128} center c={item.color}>{item.state}</Label>
    </g>
  </g>;
};
const Boundary=({t,p}:Scene)=>{
  const cx=p?470:850,cy=p?476:320,w=p?850:1320,h=p?720:485;
  const q=ramp(t,0,2);
  return <g>
    <rect x={cx-w/2} y={cy-h/2} width={w} height={h} rx="42" fill="#0a1426" fillOpacity=".77" stroke="#5a90b4" strokeWidth="2" strokeDasharray="7 10"/>
    <Label x={cx-w/2+44} y={cy-h/2+55} c={muted}>OPTIONAL PROVIDER SCOPE</Label>
    <Label x={cx-w/2+44} y={cy-h/2+92} c={amber}>COMPOSE / MODIFY CAN AUTHORIZE SEND</Label>
    <rect x={cx-w/2+34} y={cy-h/2+124} width={w-68} height={h-160} rx="26" fill="#09293a" stroke={cyan} opacity={.85} strokeWidth="2"/>
    <Label x={cx-w/2+63} y={cy-h/2+178} c={cyan}>AGENT INTERFACE</Label>
    {(['mail','file','stop'] as const).map((name,i)=>{
      const x=p?cx+(i-1)*240:cx+(i-1)*350;
      const y=p?cy+70:cy+33;
      return <g key={name} opacity={.15+.85*ramp(t,i*.35,1+i*.35)}>
        <Chip x={x} y={y} name={name} c={i===2?red:i===1?mint:cyan} tag={['READ','DRAFT','NO SEND'][i]} size={p?190:218} active={q*.65}/>
      </g>;
    })}
    <Rail d={p?'M140 744H797':'M256 499H1440'} c={cyan} on={modulo(t*.27,1)}/>
  </g>;
};
const Ecosystem=({t,p,detail}:Scene)=>{
  const positions=p?[[470,152],[470,454],[470,756]]:[[282,282],[850,282],[1418,282]];
  const names=['PYTHON APP','CODEX SKILL','NODE EXAMPLE'];
  const colors=[cyan,mint,amber];
  const icons:SymbolName[]=['code','file','stack'];
  return <g>
    {positions.slice(1).map((pt,i)=><Rail key={i} d={railPath(positions[i] as [number,number],pt as [number,number])} c={colors[i+1]} on={modulo(t*.25+i*.43,1)}/>)}
    {positions.map(([x,y],i)=>{
      const r=1+Math.sin(t*.9+i)*.025;
      return <g key={i} transform={'translate('+x+' '+y+') scale('+r+')'} opacity={detail==='node'&&i!==2?.55:1}>
        <ellipse rx="177" ry="80" cy="29" opacity=".18" fill={colors[i]}/>
        <Chip x={0} y={0} name={icons[i]} tag={names[i]} c={colors[i]} size={328} active={.24+.26*Math.cos(t*2-i)}/>
        <Label x={0} y={112} c={colors[i]} center size={25}>0{i+1}</Label>
      </g>;
    })}
  </g>;
};
const Recovery=({t,p,detail}:Scene)=>{
  const xs=p?[181,470,764]:[276,855,1454];
  const cy=p?497:272;
  const q=modulo(t/4,1);
  const left: [number,number]=[xs[0],cy+100], right:[number,number]=[xs[2],cy+100];
  const signalX=left[0]+(right[0]-left[0])*inOut(q);
  const signalY=cy-66-882*q*(1-q);
  return <g>
    <Rail d={'M'+left[0]+' '+(cy-66)+'C'+left[0]+' '+(cy-360)+' '+right[0]+' '+(cy-360)+' '+right[0]+' '+(cy-66)} c={cyan} on={q}/>
    <Rail d={'M'+right[0]+' '+right[1]+'C'+right[0]+' '+(cy+278)+' '+left[0]+' '+(cy+278)+' '+left[0]+' '+left[1]} c={mint} on={modulo(.5+q,1)}/>
    {xs.map((x,i)=><Chip key={x} x={x} y={cy} c={i===2?mint:cyan} name={(['file','clock','check'] as const)[i]} tag={['DRAFT SAVED','RESTART','DRAFT FOUND'][i]} active={Math.max(0,1-Math.abs(q*3-i))} size={p?208:320}/>)}
    <Packet x={signalX} y={signalY} s={.67} c={mint} a={Math.sin(q*Math.PI)*.96}/>
    <Label x={p?470:855} y={p?843:516} center c={detail==='limits'?amber:mint} size={p?26:24}>
      {detail==='limits'?'ONE WORKER · NO TRANSACTIONAL LOCK':'MATCH THE SAME OPAQUE MARKER'}
    </Label>
  </g>;
};
const Skill=({t,p,detail}:Scene)=>{
  const cy=p?438:270;
  const cx=p?470:884;
  const cards=detail==='invoke'?['INSTALL LOCALLY','START CODEX','INVOKE SKILL']:detail==='audit'?['TRACE TOOLS','CHECK RULES','RUN TESTS']:['SKILL.md','WORKFLOW','REFERENCES'];
  const icons:SymbolName[]=detail==='audit'?['scan','policy','check']:['file','code','link'];
  return <g>
    {[0,1,2,3,4].map(i=><ellipse key={i} cx={cx} cy={cy} rx={(p?155:210)+i*(p?48:108)} ry={85+i*42} transform={'rotate('+(-12+3*Math.sin(t*.44))+' '+cx+' '+cy+')'} stroke={i%2?mint:cyan} fill="none" opacity={.09+i*.029} strokeDasharray={i%2?'5 9':undefined}/>)}
    {cards.map((name,i)=>{
      const theta=t*.76+i*Math.PI*.70;
      const x=cx+(i-1)*(p?281:472);
      const y=cy+Math.sin(theta)*36+(p?(i-1)*146:0);
      return <g key={name} opacity={.4+.6*ramp(t,.3+i*.3,1+i*.3)}>
        <Chip x={x} y={y} tag={name} name={icons[i]} c={i===1?mint:cyan} active={.33+.31*Math.sin(theta)} size={p?230:313}/>
      </g>;
    })}
    <Label x={cx} y={p?883:563} center c={detail==='invoke'?amber:mint} size={p?26:23}>{detail==='invoke'?'MODEL-BACKED INVOCATION UNVERIFIED':'REUSABLE GUIDANCE · SOURCE CONTROLLED'}</Label>
  </g>;
};

const runs:Record<string,{title:string;lines:string[]}>={
  trailer:{title:'LOCAL RUN + GITHUB ACTIONS',lines:['$ python -m secure_inbox.cli','"draft_count": 1','"send_operation_available": false','Python: 45 passed, 1 skipped   /   Ruff: passed','Node: 12 passed   /   Docker inspector CI: passed']},
  python:{title:'PYTHON / EXCERPT FROM OFFLINE JSON',lines:['$ python -m secure_inbox.cli','"outcomes": [ ["demo-1", "drafted"],','  ["demo-2", "needs_review"],','  ["demo-3", "needs_review"] ],','"draft_count": 1,','"send_operation_available": false']},
  duplicate:{title:'PYTHON / SECOND RUN JSON EXCERPT',lines:['"second_run": [','  ["demo-1", "duplicate_skipped"],','  ["demo-2", "duplicate_skipped"],','  ["demo-3", "duplicate_skipped"]','],','"injection_detected": true']},
  node:{title:'NODE / INDEPENDENT ACCEPTANCE EXAMPLE',lines:['$ npm test','tests 12   /   pass 12   /   fail 0','', '$ npm run demo','2 acknowledgment drafts · review pending','Suspicious: manual review · Duplicate: skipped']},
  ci:{title:'GITHUB ACTIONS / RUN 44531721205',lines:['✓  test (3.11)','✓  test (3.12)','✓  docker-inspector','✓  node-acceptance']},
  install:{title:'POWERSHELL / FROM THE CLONED REPOSITORY',lines:['> py -3.11 -m venv .venv','> ./.venv/Scripts/python.exe -m pip install -e ".[test]"','> ./.venv/Scripts/python.exe -m secure_inbox.cli','> ./.venv/Scripts/python.exe -m pytest -q']},
  guide:{title:'HANDS-ON / DOCS/TEST_IT_YOURSELF.MD',lines:['PYTHON      offline CLI · pytest · Ruff','NODE        npm test · npm run demo','CODEX       project-local install','            $secure-inbox-agent']}
};
const Terminal=({t,p,d,detail}:Scene)=>{
  const data=runs[detail??'python']??runs.python;
  const x=p?60:148,y=p?195:62,w=p?820:1424;
  const h=p?587:454;
  const n=data.lines.length;
  const pace=Math.min(.69,(d-2)/n);
  return <g transform={'translate(0 '+(1-inOut(ramp(t,0,.88)))*38+')'}>
    <rect x={x+22} y={y+26} rx="29" width={w} height={h} fill="#02060e" opacity=".8"/>
    <rect x={x} y={y} rx="29" width={w} height={h} fill="#071323" stroke="#43728e" strokeWidth="2"/>
    <path d={'M'+x+' '+(y+79)+'H'+(x+w)} stroke="#3d6d8b" strokeOpacity=".5"/>
    {[red,amber,mint].map((c,i)=><circle key={c} cx={x+35+i*26} cy={y+39} r="5" fill={c}/>)}
    <Label x={x+(p?120:146)} y={y+47} c={cyan} size={p?17:24}>{data.title}</Label>
    {data.lines.map((line,i)=>{
      const q=ramp(t,.29+pace*i,.48+pace*i);
      return <g key={i} opacity={q}><Label x={x+48} y={y+140+i*(p?61:48)} c={line.startsWith('✓')?mint:line.startsWith('$')||line.startsWith('>')?cyan:white} size={p?24:30}>{line}</Label></g>;
    })}
    <path d={'M'+(x+49)+' '+(y+h-30)+'h22'} stroke={mint} strokeWidth="4" opacity={.3+.62*(Math.cos(t*5)>.1?1:0)}/>
  </g>;
};

export const Emblem=({t,x,y,s=1}:{t:number;x:number;y:number;s?:number})=><g transform={'translate('+x+' '+y+') scale('+s+')'}>
  {[0,1,2,3].map(i=><g key={i} transform={'rotate('+(t*(i%2===0?19:-13)+i*53)+')'}>
    <circle r={151+i*43} stroke={cyan} fill="none" opacity={.13+i*.065} strokeDasharray={(23+i*7)+' '+(13+i*11)}/>
    <circle cx={151+i*43} r="5" fill={i%2?mint:cyan}/>
  </g>)}
  <path d="M0 -147L131 -73V73L0 150L-131 73V-73Z" fill="#102941" stroke={cyan} strokeWidth="3"/>
  <path d="M0 -120L105 -59V59L0 122L-105 59V-59Z" fill="#0a192b" stroke="#246080" strokeWidth="2"/>
  <Glyph x={-65} y={-72} size={130} name="mail" c={mint}/>
  <path d="M-26 82H26" stroke={mint} strokeWidth="4" strokeLinecap="round"/>
</g>;

export const Graphic=({kind,p,detail,d}:{kind:string;p:boolean;detail?:string;d:number})=>{
  const {fps}=useVideoConfig();
  const t=useCurrentFrame()/fps;
  const args={t,fps,p,detail,d};
  if(kind==='close')return <Stage p={p}><Emblem t={t} x={p?470:1290} y={p?420:293} s={p?1.35:1.02}/></Stage>;
  return <Stage p={p}>
    {kind==='inbox'&&<Inbox {...args}/>}
    {kind==='gate'&&<Gate {...args}/>}
    {kind==='pipeline'&&<Pipeline {...args}/>}
    {kind==='draft'&&<Draft {...args}/>}
    {kind==='case'&&<Case {...args}/>}
    {kind==='boundary'&&<Boundary {...args}/>}
    {kind==='ecosystem'&&<Ecosystem {...args}/>}
    {kind==='recovery'&&<Recovery {...args}/>}
    {kind==='skill'&&<Skill {...args}/>}
    {kind==='terminal'&&<Terminal {...args}/>}
    {kind==='walk'&&<Terminal {...args} detail={detail==='guide'?'guide':'install'}/>}
  </Stage>;
};
