import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

// Keep the completed Remotion renders untouched. Master into a separate folder.
const output = resolve(process.env.SKILLYT_EXPORT_DIR || '../exports');
const story = JSON.parse(readFileSync('src/story.json', 'utf8'));
const names = {Trailer:'Skill-YT-Trailer-1080p.mp4', Explainer:'Skill-YT-Explainer-1080p.mp4', Vertical:'Skill-YT-Vertical-1080x1920.mp4'};
mkdirSync(output, {recursive:true});
const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(names);
const evidence = {};
for (const id of targets) {
  if (!names[id]) throw new Error('Unknown cut: '+id);
  const input = join('out', names[id]);
  const target = join(output, names[id]);
  if (existsSync(target)) throw new Error('Refusing to replace existing master: '+target);
  const duration = story[id].reduce((total, beat)=>total+beat.d, 0);
  const measurement = spawnSync('ffmpeg', ['-hide_banner','-nostats','-i',input,'-vn','-af',
    'loudnorm=I=-16:TP=-2:LRA=11:print_format=json','-f','null','-'], {encoding:'utf8', maxBuffer:8*1024*1024});
  if (measurement.status !== 0) throw new Error(measurement.stderr);
  const match = measurement.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
  if (!match) throw new Error('No loudness measurement: '+id);
  const stats = JSON.parse(match[0]);
  const af = 'loudnorm=I=-16:TP=-2:LRA=11:measured_I='+stats.input_i+
    ':measured_TP='+stats.input_tp+':measured_LRA='+stats.input_lra+
    ':measured_thresh='+stats.input_thresh+':offset='+stats.target_offset+':linear=true:print_format=summary'+
    ',aresample=192000,alimiter=limit=0.6:level=false:attack=5:release=70:latency=true,aresample=48000';
  // Explicit full-range -> limited-range conversion preserves the original grade.
  // Four-frame entrance and five-frame finish keep captions and narration in place.
  const vf = 'scale=in_range=pc:out_range=tv,format=yuv420p,'+
    'fade=t=in:st=0:d=0.133333,fade=t=out:st='+(duration-5/30)+':d=0.166667';
  const args = ['-hide_banner','-nostats','-n','-i',input,'-map','0:v:0','-map','0:a:0',
    '-vf',vf,'-af',af,'-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',
    '-color_range','tv','-c:a','aac','-b:a','192k','-ar','48000','-t',String(duration),
    '-movflags','+faststart','-metadata','title=Skill-YT '+id,
    '-metadata','comment=Offline synthetic demonstration. Local review master. No live Gmail or sending.',target];
  const render = spawnSync('ffmpeg', args, {encoding:'utf8', maxBuffer:8*1024*1024});
  writeFileSync(join(output,id+'-mastering.log'), render.stderr);
  if (render.status !== 0) throw new Error('Master failed: '+id+'\n'+render.stderr);
  const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',target],{encoding:'utf8'}));
  evidence[id] = {source:resolve(input), output:target, loudnessInput:stats, videoFilter:vf, audioFilter:af, probe};
  console.log(id+' mastered: '+target);
}
writeFileSync(join(output,'mastering.json'),JSON.stringify(evidence,null,2)+'\n');
