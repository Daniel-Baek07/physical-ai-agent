# Video kit: clips in, finished short out

Vertical 9:16 shorts (1080×1920, 30fps). Claude does the edit; Daniel drops clips and says what he wants.

## Daniel's part

1. Make a folder `video/<video-name>/clips/` and drop every raw clip and screenshot in. Names don't matter.
2. Tell Claude what the video is: the hook, the order of beats, the funny moments ("clip 3 around 0:40 is my reaction"), and any text you want on screen.
3. Watch the preview Claude sends. Give notes in plain words ("hook faster", "cut the second Tetris round", "bigger counter"). Claude re-renders.
4. Say "final". The full-quality MP4 lands in `video/<video-name>/renders/`.

## Claude's part (the workflow; the skill follows it)

| step | where | command |
|---|---|---|
| 1. proxies | Mac (device_bash) | `bash video/kit/bin/proxy.sh video/<name>` → `proxies/` (h264, 1920 long side, 30fps; images copied) |
| 2. stage | → cloud | `device_stage_files` on `proxies/*` (≤50 files/call) |
| 3. kit | cloud | copy `video/kit` → `/home/claude/kit`, `npm ci` (or `npm install`) |
| 4. look | cloud | `python3 kit/bin/ingest.py <proj>` → `_ingest/*.sheet.png` + `ingest.md`; Read the sheets |
| 5. edit | cloud | write `<proj>/edit.json` (spec below). Save a copy back to the Mac folder |
| 6. preview | cloud | `kit/bin/render.sh <proj> preview` (half-res, ~1.5 min per 10s on 2 cores); check frames, send |
| 7. final | cloud | `kit/bin/render.sh <proj> final` → commit the MP4 to `video/<name>/renders/` |

Rendering runs in the cloud workspace because it has a headless Chromium. The Mac-side workspace can't download one, since remotion.media is blocked.
Transcription: Whisper models can't be downloaded in either workspace (huggingface is blocked). Caption words come from Daniel's description plus the audio's loud/quiet spans in `ingest.md`.

## edit.json

```jsonc
{
  "look": {"grain": true, "vignette": true, "grade": "punchy"},   // grade: none|punchy|cool|warm|mono
  "timeline": [                        // played back to back
    {"src": "proxies/a.mp4", "in": 3.2, "out": 8.0},               // source seconds
    {"src": "proxies/b.mp4", "in": 0, "out": 120, "speed": 8, "enter": "whip"},   // sped up (auto-muted)
    {"src": "proxies/b.mp4", "freeze": 41.5, "hold": 1.5, "enter": "flash"},      // freeze frame
    {"src": "proxies/c.mov", "in": 2, "out": 6, "fit": "blur",      // landscape clip on a blurred fill
     "punch": [{"at": 1.1, "dur": 0.6, "scale": 1.4, "x": 0.6, "y": 0.4}]},       // punch-in zoom (at = s into this clip)
    {"src": "proxies/shot.png", "in": 0, "out": 2, "drift": 0.06}  // still image with slow push-in
  ],
  "overlays": [                        // times = OUTPUT seconds
    {"type": "hook", "start": 0, "end": 2.4, "text": "I taught a keyboard to type 618 WPM", "highlight": ["618"]},
    {"type": "captions", "words": [{"t": 2.7, "text": "every"}, {"t": 2.95, "text": "key"}], "perChunk": 3},
    {"type": "counter", "start": 5, "end": 12, "from": 0, "to": 8540, "label": "KEYSTROKES", "countStart": 5.2, "countEnd": 11.5},
    {"type": "speed", "start": 5, "end": 12, "text": "8×"},
    {"type": "vs", "start": 12, "end": 15, "left": "Human", "right": "Claude"},
    {"type": "callout", "start": 15, "end": 17, "text": "dead channel", "x": 0.5, "y": 0.55, "arrow": "up"},
    {"type": "image", "start": 2, "end": 4.5, "src": "proxies/comment.png", "y": 0.38},
    {"type": "badge", "start": 3, "end": 4.5, "text": "698 likes", "y": 0.62},
    {"type": "title", "start": 20, "end": 21.5, "kicker": "ROUND 2", "text": "no mercy"},
    {"type": "flash", "at": 9.0},
    {"type": "progress"},
    {"type": "endcard", "start": 28, "end": 30, "text": "what should it play next?", "sub": "comment below"}
  ],
  "sfx": [{"at": 6.0, "name": "key"}],  // extra; auto sfx follow hooks/whips/pops (autoSfx:false to turn off)
  "music": {"src": "clips/track.mp3", "volume": 0.15}
}
```

Transitions (`enter`): `cut` `zoom` `whip` `flash` `glitch`. SFX available: `pop hit impact whoosh whoosh_short glitch riser_end key`.

Layout rules: keep text out of the bottom 22% and the right 13% (TikTok/Reels UI covers them). Don't show the counter and the speed tag on screen at the same time as `vs`, because all three sit at the top. Change colors and fonts in `src/theme.ts`.

## Style defaults (what makes it look like the channel)
- Hook in the first 0.1s. Highlight 1 word (the number). Hook is gone by ~2.5s.
- Cut every 1–3s in the setup. Speed-ramp the long build parts (6–12×) with the counter running.
- Punch-in on every payoff moment (key press, reaction). Freeze-frame + callout for anything the viewer must notice.
- End on a question, not a goodbye.
