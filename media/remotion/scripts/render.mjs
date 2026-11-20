import {spawnSync} from 'node:child_process';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';

const names={
  Trailer:'Skill-YT-Trailer-1080p.mp4',
  Explainer:'Skill-YT-Explainer-1080p.mp4',
  Vertical:'Skill-YT-Vertical-1080x1920.mp4',
};
const argumentsList=process.argv.slice(2);
const silent=argumentsList.includes('--silent');
const requestedTargets=argumentsList.filter(argument=>argument!=='--silent');
const targets=requestedTargets.length?requestedTargets:Object.keys(names);
const concurrency=process.env.SKILLYT_RENDER_CONCURRENCY??'5';
const format=['--codec=h264','--pixel-format=yuv420p','--audio-codec=aac','--crf=18','--is-production=false'];
mkdirSync('out',{recursive:true});
const audioProps=silent?['--props=out/silent-render-props.json']:[];
if(silent)writeFileSync('out/silent-render-props.json',JSON.stringify({sound:false}));
const run=(args)=>{
  const response=spawnSync(process.execPath,['node_modules/@remotion/cli/remotion-cli.js',...args],{stdio:'inherit'});
  if(response.status!==0) throw new Error('Remotion exited with '+(response.error??response.status));
};
for (const target of targets) {
  if(target==='Poster'){
    if(existsSync('out/Skill-YT-Thumbnail.png'))throw new Error('Poster already exists. Choose a new output path with the Remotion CLI.');
    run(['still','src/index.tsx','Skill-YT-Poster','out/Skill-YT-Thumbnail.png','--is-production=false']);
    continue;
  }
  if(!names[target]) throw new Error('Unknown composition '+target);
  if(!silent&&!existsSync('public/audio/'+target+'.wav')) throw new Error('Restore public/audio/'+target+'.wav, run npm run audio, or use --silent.');
  run(['render','src/index.tsx','Skill-YT-'+target,'out/'+names[target],...format,...audioProps,'--overwrite=false','--concurrency='+concurrency]);
}
