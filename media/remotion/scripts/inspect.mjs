import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const cuts={
  Trailer:{
    filename:'Skill-YT-Trailer-1080p.mp4', width:1920,height:1080, duration:45,
    sample:[1.2,3.9,6.4,10.8,13.6,20.1,23.5,28.2,32.2,36.5,39.5,44.6], cols:3,
  },
  Explainer:{
    filename:'Skill-YT-Explainer-1080p.mp4', width:1920,height:1080, duration:300,
    sample:[2,17.5,33.5,36.8,52,68.8,71.6,88,101,118.2,121.7,143,152,168.4,171.7,194,213.4,216.6,247,268.3,271.6,279.5,288.3,291.4,295.2,299.3],cols:4,
  },
  Vertical:{
    filename:'Skill-YT-Vertical-1080x1920.mp4', width:1080,height:1920,duration:27,
    sample:[1.5,7.5,12.8,18.8,25.6],cols:5,
  },
};
const run=(command,args)=>execFileSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024});
const root=process.env.SKILLYT_INSPECT_DIR??'out';
const story=JSON.parse(readFileSync('src/story.json','utf8'));
// Include every scene, plus close transitions and the beginning/middle/end of each chapter.
let at=0;
const chapters=[];
for(const beat of story.Explainer){
  if(!chapters.length||chapters.at(-1).name!==beat.k.slice(0,2))chapters.push({name:beat.k.slice(0,2),start:at,end:at});
  chapters.at(-1).end=at+beat.d;
  cuts.Explainer.sample.push(at+beat.d/2);
  at+=beat.d;
}
for(const ch of chapters)cuts.Explainer.sample.push(ch.start+.9,(ch.start+ch.end)/2,ch.end-.7);
cuts.Explainer.sample=[...new Set(cuts.Explainer.sample)].sort((a,b)=>a-b);
cuts.Explainer.cols=5;
const result={};
for(const [id,cut] of Object.entries(cuts)){
  if(process.argv.length>2&&!process.argv.slice(2).includes(id))continue;
  const path=join(root,cut.filename);
  const probe=JSON.parse(run('ffprobe',['-v','error','-show_entries',
    'format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate,duration,nb_frames,sample_rate,channels',
    '-of','json',path]));
  const video=probe.streams.find(s=>s.codec_type==='video');
  const audio=probe.streams.find(s=>s.codec_type==='audio');
  if(video?.width!==cut.width || video.height!==cut.height || video.avg_frame_rate!=='30/1' ||
    video.codec_name!=='h264' || !['yuv420p','yuvj420p'].includes(video.pix_fmt) || audio?.codec_name!=='aac' ||
    Math.abs(+probe.format.duration-cut.duration)>.05 || +video.nb_frames!==cut.duration*30 ||
    Math.abs(+video.duration - +audio.duration)>.06) throw new Error('Master spec mismatch for '+id);
  const diagnostics=spawnSync('ffmpeg',['-hide_banner','-nostats','-xerror','-i',path,'-vf','blackdetect=d=0.20:pix_th=0.04',
    '-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',maxBuffer:32*1024*1024});
  if(diagnostics.status!==0)throw new Error('Decode failed for '+id+'\n'+diagnostics.stderr);
  const blackIntervals=diagnostics.stderr.split('\n').filter(line=>line.includes('black_start:'));
  if(blackIntervals.length)throw new Error('Unexpected black intervals for '+id+'\n'+blackIntervals.join('\n'));
  const audioSummary=diagnostics.stderr.slice(diagnostics.stderr.lastIndexOf('Summary:')).trim();
  const truePeak=Number(audioSummary.match(/Peak:\s*([-\d.]+) dBFS/)?.[1]);
  const integratedLoudness=Number(audioSummary.match(/I:\s*([-\d.]+) LUFS/)?.[1]);
  if(!Number.isFinite(truePeak)||truePeak>-1)throw new Error('True peak requires correction: '+id+' '+truePeak+' dBTP');
  if(!Number.isFinite(integratedLoudness)||Math.abs(integratedLoudness+16)>2)throw new Error('Loudness outside review target: '+id);
  const folder=join(root,'review',id);
  mkdirSync(folder,{recursive:true});
  const scale=id==='Vertical'?'216:384':'480:270';
  for(const [i,t] of cut.sample.entries()){
    const grab=join(folder,String(i).padStart(2,'0')+'.png');
    run('ffmpeg',['-v','error','-ss',String(t),'-i',path,'-frames:v','1','-vf','scale='+scale+':flags=lanczos','-y',grab]);
    if(!statSync(grab).size)throw new Error('Empty review frame '+grab);
  }
  run('ffmpeg',['-v','error','-framerate','1','-i',join(folder,'%02d.png'),'-vf',
    'tile='+cut.cols+'x'+Math.ceil(cut.sample.length/cut.cols)+':padding=8:margin=8:color=0x101b29',
    '-frames:v','1','-y',join(root,'Skill-YT-'+id+'-Contact-Sheet.png')]);
  result[id]={probe,reviewFrameSeconds:cut.sample,blackIntervals,truePeak,integratedLoudness,audioSummary};
  console.log(id,JSON.stringify(result[id]));
}
writeFileSync(join(root,'export-inspection.json'),JSON.stringify(result,null,2)+'\n');
