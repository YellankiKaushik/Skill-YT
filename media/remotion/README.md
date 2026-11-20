# Skill-YT motion project

Editable Remotion compositions explain the Secure Inbox AI Agent using synthetic inbox messages. The trailer is 45 seconds, the explainer is five minutes, and the portrait short is 27 seconds. Captions are included in the source.

## Install and preview

Use Node.js 24 and npm 11. Run these commands from `media/remotion/` in a cloned repository. The committed lockfile records the dependency versions.

```powershell
npm ci
npm run check
npm run compositions
npm run studio
```

Remotion downloads its rendering browser when needed. Network access is required for the first dependency/browser installation. The Studio preview runs silently when the local narration WAVs are absent.

| Composition | Frames at 30 fps | Resolution |
| --- | ---: | --- |
| `Skill-YT-Trailer` | 1,350 | 1920 x 1080 |
| `Skill-YT-Explainer` | 9,000 | 1920 x 1080 |
| `Skill-YT-Vertical` | 810 | 1080 x 1920 |
| `Skill-YT-Poster` | Still | 1280 x 720 |

## Render with captions

A source checkout can render captioned videos without narration assets.

```powershell
npm run render -- Trailer Vertical Explainer --silent
npm run render -- Poster
```

Outputs are written to `out/`. Existing videos and posters are protected from replacement. For another revision, use the Remotion CLI with a different output filename. Reduce resource use with `$env:SKILLYT_RENDER_CONCURRENCY = '2'`.

## Narration and original sound design

For narrated rendering, supply the existing `Trailer.wav`, `Explainer.wav`, and `Vertical.wav` in `public/audio/`. These WAVs are kept locally and are excluded from Git. A separately approved source archive can carry the exact original tracks. Source publication alone does not supply those recordings.

Alternatively, regenerate narration and the synthesized sound bed locally. Install FFmpeg and make `ffmpeg` and `ffprobe` available on PATH. These commands install the separate voice tool and download its model on first use.

```powershell
$env:SKILLYT_VOICE_TOOL = Join-Path $env:TEMP 'skill-yt-voice-tool'
New-Item -ItemType Directory -Force $env:SKILLYT_VOICE_TOOL | Out-Null
npm install --prefix $env:SKILLYT_VOICE_TOOL kokoro-js@1.2.1
npm run audio
npm run render -- Trailer Vertical Explainer
```

Audio regeneration writes WAVs, captions and timing metadata. Preserve any recordings and caption edits before running it. Regenerated speech may differ from the original tracks. The configured voice is Kokoro `af_heart`; model inference and oscillator-based music generation run locally. Asset provenance is documented in [ASSET_LICENSES.md](../production/ASSET_LICENSES.md).

## Finish and inspect narrated exports

After rendering narrated videos and the poster, run these commands. Mastering requires audio streams and FFmpeg.

```powershell
npm run master
npm run package-review
$env:SKILLYT_INSPECT_DIR = '../exports'
npm run inspect
```

Mastering writes H.264/yuv420p MP4s with AAC audio, short opening/closing fades, loudness normalization and peak limiting. It refuses to replace an existing video. Set `SKILLYT_EXPORT_DIR` to a fresh directory for a later revision and set `SKILLYT_INSPECT_DIR` to that same directory before inspection. Package-review also refreshes production subtitle files from the timing JSON.

Inspection verifies stream metadata and full decoding, measures loudness and peaks, and extracts representative frames/contact sheets. Caption validation compares every narration script with its cue text and checks overlaps and orphan words. Captions use sentence timing with proportional page timing; review synchronization when changing narration.

Finished exports are generated locally under `media/exports/`. Public watch/download links will be added after separate video-release approval. The [visitor guide](../../docs/VIDEO_WALKTHROUGH.md) describes the project and the [public production summary](../production/PUBLIC_VIDEO_SUMMARY.md) records verification and limitations.

## Source map

- [Compositions and timeline](src/index.tsx)
- [Vector animation components](src/visuals.tsx)
- [Scene definitions and narration](src/story.json)
- [Caption timing](src/audio-timing.json)
- [Typography and safe areas](src/style.css)
- [Audio generation](scripts/audio.mjs)
- [Narration script](../production/NARRATION.md)
- [Subtitle files](../production/captions/)
- [Fact check](../production/FACT_CHECK.md)

## Rendering environment

If Webpack rejects a temporary path containing an exclamation mark, choose a project-local temporary directory for that shell.

```powershell
$env:TEMP = Join-Path (Get-Location).Path 'out/temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
npm run studio
```

If a restricted environment blocks the browser's localhost connection, preview and rendering require an environment that permits that connection. Type checking can still run independently.

The production used the official [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), pinned to [6f55706](https://github.com/remotion-dev/skills/tree/6f55706d1069e512430582ad86e4e57dc07afe1b). See the official [render CLI](https://www.remotion.dev/docs/cli/render) and [Remotion licensing](https://www.remotion.dev/docs/license) for current usage requirements.
