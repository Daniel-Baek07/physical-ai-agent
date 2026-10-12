import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Clip} from './components/Clip';
import {Badge, Callout, Captions, Counter, EndCard, Flash, Hook, ImageCard, Progress, SpeedTag, TitleCard, Versus} from './components/Overlays';
import {Edit, Overlay, Sfx, clipDuration} from './types';

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 30} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
);

const span = (o: Overlay, fps: number): [number, number] => {
  if (o.type === 'flash') return [Math.round(o.at * fps), 7];
  if (o.type === 'captions') {
    const last = o.words[o.words.length - 1];
    const s = Math.round((o.words[0]?.t ?? 0) * fps);
    return [0, Math.max(1, Math.round(((last?.end ?? (last?.t ?? 0) + 1)) * fps))];
  }
  if (o.type === 'progress') return [Math.round((o.start ?? 0) * fps), -1];
  return [Math.round(o.start * fps), Math.max(1, Math.round((o.end - o.start) * fps))];
};

const renderOverlay = (o: Overlay, dur: number, fps: number) => {
  switch (o.type) {
    case 'hook': return <Hook {...o} dur={dur} />;
    case 'captions': return <Captions {...o} />;
    case 'counter': return <Counter {...o} dur={dur} startSec={o.start} />;
    case 'badge': return <Badge {...o} dur={dur} />;
    case 'image': return <ImageCard {...o} dur={dur} />;
    case 'callout': return <Callout {...o} dur={dur} />;
    case 'vs': return <Versus {...o} dur={dur} />;
    case 'speed': return <SpeedTag {...o} dur={dur} />;
    case 'title': return <TitleCard {...o} dur={dur} />;
    case 'endcard': return <EndCard {...o} dur={dur} />;
    case 'flash': return <Flash color={o.color} />;
    case 'progress': return <Progress dur={dur} />;
  }
};

// Sound effects that follow automatically from the edit
export const autoSfx = (edit: Edit): Sfx[] => {
  if (edit.autoSfx === false) return [];
  const out: Sfx[] = [];
  let t = 0;
  edit.timeline.forEach((c, i) => {
    if (i > 0 && c.enter === 'whip') out.push({at: Math.max(0, t - 0.08), name: 'whoosh', volume: 0.6});
    if (i > 0 && (c.enter === 'flash' || c.enter === 'zoom')) out.push({at: t, name: 'hit', volume: 0.5});
    if (i > 0 && c.enter === 'glitch') out.push({at: t, name: 'glitch', volume: 0.5});
    for (const p of c.punch ?? []) out.push({at: t + p.at, name: 'whoosh_short', volume: 0.35});
    t += clipDuration(c);
  });
  for (const o of edit.overlays ?? []) {
    if (o.type === 'hook') out.push({at: o.start, name: 'hit', volume: 0.55});
    if (o.type === 'image' || o.type === 'badge' || o.type === 'callout') out.push({at: o.start, name: 'pop', volume: 0.5});
    if (o.type === 'vs' || o.type === 'title') out.push({at: o.start, name: 'impact', volume: 0.6});
    if (o.type === 'endcard') out.push({at: o.start, name: 'riser_end', volume: 0.5});
    if (o.type === 'flash') out.push({at: o.at, name: 'hit', volume: 0.5});
  }
  return out;
};

export const Short: React.FC<Edit> = (edit) => {
  const {fps, durationInFrames} = useVideoConfig();
  let cursor = 0;
  const clips = edit.timeline.map((c, i) => {
    const d = Math.max(1, Math.round(clipDuration(c) * fps));
    const from = cursor;
    cursor += d;
    return (
      <Sequence key={`c${i}`} from={from} durationInFrames={d} name={`clip ${i}: ${c.src}`}>
        <Clip c={c} durationInFrames={d} lookGrade={edit.look?.grade} />
      </Sequence>
    );
  });
  const sfx = [...autoSfx(edit), ...(edit.sfx ?? [])];
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {clips}
      {edit.look?.vignette !== false ? <Vignette /> : null}
      {edit.look?.grain ? <Grain /> : null}
      {(edit.overlays ?? []).map((o, i) => {
        const [from, d0] = span(o, fps);
        const d = d0 < 0 ? durationInFrames - from : d0;
        return (
          <Sequence key={`o${i}`} from={from} durationInFrames={d} name={`${o.type} ${i}`}>
            {renderOverlay(o, d, fps)}
          </Sequence>
        );
      })}
      {sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.round(s.at * fps)} name={`sfx ${s.name}`}>
          <Audio src={staticFile(`_kit/sfx/${s.name}.wav`)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
      {edit.music ? (
        <Sequence from={Math.round((edit.music.start ?? 0) * fps)}>
          <Audio src={staticFile(edit.music.src)} volume={edit.music.volume ?? 0.18} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
