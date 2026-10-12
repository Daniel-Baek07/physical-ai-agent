import React from 'react';
import {AbsoluteFill, Easing, Freeze, OffthreadVideo, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ClipItem} from '../types';
import {grades} from '../theme';

const isImage = (src: string) => /\.(png|jpe?g|webp|gif)$/i.test(src);

const Media: React.FC<{c: ClipItem; fit: 'cover' | 'contain'; style?: React.CSSProperties; muted?: boolean}> = ({c, fit, style, muted}) => {
  const {fps} = useVideoConfig();
  const fx = (c.focusX ?? 0.5) * 100;
  const fy = (c.focusY ?? 0.5) * 100;
  const common: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: fit, objectPosition: `${fx}% ${fy}%`, ...style,
  };
  const src = staticFile(c.src);
  if (isImage(c.src)) return <Img src={src} style={common} />;
  const speed = c.speed ?? 1;
  const vol = muted || speed > 1.5 ? 0 : c.volume ?? 1;
  if (c.freeze !== undefined) {
    return (
      <Freeze frame={0}>
        <OffthreadVideo src={src} trimBefore={Math.round(c.freeze * fps)} muted style={common} />
      </Freeze>
    );
  }
  return (
    <OffthreadVideo
      src={src}
      trimBefore={Math.round((c.in ?? 0) * fps)}
      playbackRate={speed}
      volume={vol}
      muted={vol === 0}
      style={common}
    />
  );
};

export const Clip: React.FC<{c: ClipItem; durationInFrames: number; lookGrade?: string}> = ({c, durationInFrames, lookGrade}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // --- transition in
  const enter = c.enter ?? 'cut';
  let tx = 0, blur = 0, scale = 1, hue = 0, jitter = 0;
  if (enter === 'zoom') {
    scale *= interpolate(frame, [0, 9], [1.28, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  }
  if (enter === 'whip') {
    tx = interpolate(frame, [0, 7], [70, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    blur = interpolate(frame, [0, 7], [40, 0], {extrapolateRight: 'clamp'});
    scale *= interpolate(frame, [0, 7], [1.12, 1], {extrapolateRight: 'clamp'});
  }
  if (enter === 'glitch' && frame < 7) {
    jitter = ((frame * 37) % 7) - 3;
    hue = (frame % 2) * 90;
  }

  // --- constant zoom + slow drift
  scale *= c.zoom ?? 1;
  if (c.drift) scale *= interpolate(frame, [0, durationInFrames], [1, 1 + c.drift]);

  // --- punch-ins
  let ox = 50, oy = 50;
  for (const p of c.punch ?? []) {
    const s = Math.round(p.at * fps);
    const e = s + Math.round((p.dur ?? 0.8) * fps);
    if (frame >= s - 1 && frame <= e + 8) {
      const k = interpolate(frame, [s, s + 4, e, e + 7], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
      });
      scale *= 1 + ((p.scale ?? 1.35) - 1) * k;
      ox = (p.x ?? 0.5) * 100;
      oy = (p.y ?? 0.5) * 100;
    }
  }

  const grade = grades[c.grade ?? lookGrade ?? 'punchy'] ?? 'none';
  const filter = [grade !== 'none' ? grade : '', blur ? `blur(${blur}px)` : '', hue ? `hue-rotate(${hue}deg)` : '']
    .filter(Boolean).join(' ') || undefined;
  const transform = `translateX(${tx + jitter}%) scale(${scale})`;
  const fit = c.fit ?? 'cover';

  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform, transformOrigin: `${ox}% ${oy}%`, filter}}>
        {fit === 'blur' ? (
          <>
            <Media c={c} fit="cover" muted style={{filter: 'blur(48px) brightness(0.45) saturate(1.3)', transform: 'scale(1.25)'}} />
            <AbsoluteFill><Media c={c} fit="contain" /></AbsoluteFill>
          </>
        ) : (
          <Media c={c} fit={fit} />
        )}
      </AbsoluteFill>
      {enter === 'flash' && frame < 8 ? (
        <AbsoluteFill style={{backgroundColor: '#fff', opacity: interpolate(frame, [0, 7], [1, 0])}} />
      ) : null}
    </AbsoluteFill>
  );
};
