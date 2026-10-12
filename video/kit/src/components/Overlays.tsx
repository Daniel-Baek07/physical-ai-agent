import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {CaptionWord} from '../types';

const stroke = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${theme.ink}`,
  paintOrder: 'stroke fill',
  textShadow: `0 ${px * 0.8}px ${px * 2}px rgba(0,0,0,0.55)`,
});

// Fade/scale out over the last few frames of an overlay
const useExit = (durationInFrames: number, frames = 6) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [durationInFrames - frames, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic),
  });
};

/* ---------------------------------------------------------------- hook */
export const Hook: React.FC<{text: string; highlight?: string[]; y?: number; size?: number; dur: number}> = ({text, highlight = [], y, size = 104, dur}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const out = useExit(dur);
  const words = text.split(/\s+/);
  const hl = highlight.map((h) => h.toLowerCase());
  return (
    <AbsoluteFill style={{alignItems: 'center', top: (y ?? theme.safeTop + 0.03) * height, height: 'auto'}}>
      <div style={{width: '88%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${size * 0.12}px ${size * 0.26}px`,
        opacity: out, transform: `scale(${0.9 + 0.1 * out})`}}>
        {words.map((w, i) => {
          const s = spring({frame: frame - i * 2, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
          const isHl = hl.includes(w.toLowerCase().replace(/[^a-z0-9×%]/gi, ''));
          return (
            <span key={i} style={{
              fontFamily: theme.display, fontSize: size, lineHeight: 1.02, textTransform: 'uppercase', color: isHl ? theme.ink : theme.paper,
              display: 'inline-block', transform: `scale(${interpolate(s, [0, 1], [1.7, 1])}) rotate(${isHl ? -2 : 0}deg)`,
              opacity: s > 0.02 ? 1 : 0, filter: `blur(${interpolate(s, [0, 1], [10, 0])}px)`,
              ...(isHl ? {background: theme.accent, padding: `0 ${size * 0.12}px`, borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.45)'} : stroke(size * 0.09)),
            }}>{w}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- captions */
type Chunk = {words: CaptionWord[]; start: number; end: number};
export const chunkWords = (words: CaptionWord[], per = 3): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: CaptionWord[] = [];
  const flush = (end: number) => {
    if (cur.length) chunks.push({words: cur, start: cur[0].t, end});
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && (cur.length >= per || (prev && w.t - (prev.end ?? prev.t + 0.35) > 0.5) || /[.!?,]$/.test(prev?.text ?? ''))) {
      flush(w.t);
    }
    cur.push(w);
  });
  const last = words[words.length - 1];
  if (last) flush(last.end ?? last.t + 0.7);
  return chunks.map((c, i) => ({...c, end: Math.min(c.end, chunks[i + 1]?.start ?? c.end)}));
};

export const Captions: React.FC<{words: CaptionWord[]; y?: number; perChunk?: number}> = ({words, y = 0.64, perChunk = 3}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const t = frame / fps;
  const chunk = chunkWords(words, perChunk).find((c) => t >= c.start && t < c.end);
  if (!chunk) return null;
  const local = Math.round((t - chunk.start) * fps);
  const pop = spring({frame: local, fps, config: {damping: 14, stiffness: 260, mass: 0.5}});
  return (
    <AbsoluteFill style={{top: y * height, height: 'auto', alignItems: 'center'}}>
      <div style={{display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', width: '84%', transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])})`}}>
        {chunk.words.map((w, i) => {
          const active = t >= w.t && (i === chunk.words.length - 1 || t < chunk.words[i + 1].t);
          const wf = Math.round((t - w.t) * fps);
          const ws = active ? spring({frame: wf, fps, config: {damping: 12, stiffness: 300, mass: 0.4}}) : 1;
          return (
            <span key={i} style={{
              fontFamily: theme.display, fontSize: 84, textTransform: 'uppercase', lineHeight: 1.05,
              color: active ? theme.accent : theme.paper, transform: `scale(${active ? interpolate(ws, [0, 1], [1.25, 1.08]) : 1})`,
              display: 'inline-block', ...stroke(8),
            }}>{w.text}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- counter */
export const Counter: React.FC<{from: number; to: number; label: string; countStart?: number; countEnd?: number; x?: number; y?: number; suffix?: string; dur: number; startSec: number}> =
({from, to, label, countStart, countEnd, x = 0.06, y, suffix = '', dur, startSec}) => {
  const frame = useCurrentFrame();
  const {fps, height, width} = useVideoConfig();
  const t = startSec + frame / fps;
  const cs = countStart ?? startSec;
  const ce = countEnd ?? startSec + dur / fps;
  const v = Math.floor(interpolate(t, [cs, ce], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const inS = spring({frame, fps, config: {damping: 16, stiffness: 180}});
  const out = useExit(dur);
  const ticking = t > cs && t < ce;
  return (
    <div style={{position: 'absolute', left: x * width, top: (y ?? theme.safeTop + 0.09) * height,
      transform: `translateY(${interpolate(inS, [0, 1], [-40, 0])}px)`, opacity: Math.min(inS, out),
      background: 'rgba(10,10,11,0.72)', border: `2px solid ${theme.accent}`, borderRadius: 16, padding: '14px 26px 16px',
      boxShadow: '0 14px 40px rgba(0,0,0,0.5)'}}>
      <div style={{fontFamily: theme.mono, fontSize: 24, fontWeight: 700, letterSpacing: 4, color: theme.accent, display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{width: 12, height: 12, borderRadius: 6, background: ticking && frame % 16 < 8 ? '#FF3B30' : '#5a5a5a'}} />
        {label}
      </div>
      <div style={{fontFamily: theme.mono, fontSize: 76, fontWeight: 700, color: theme.paper, fontVariantNumeric: 'tabular-nums', lineHeight: 1.05}}>
        {v.toLocaleString('en-US')}{suffix}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- badge */
export const Badge: React.FC<{text: string; x?: number; y?: number; color?: string; dur: number}> = ({text, x = 0.5, y = 0.3, color = theme.accent, dur}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 11, stiffness: 240, mass: 0.6}});
  const out = useExit(dur);
  return (
    <div style={{position: 'absolute', left: x * width, top: y * height, transform: `translate(-50%,-50%) scale(${s * out}) rotate(${interpolate(s, [0, 1], [-8, -3])}deg)`,
      background: color, color: theme.ink, fontFamily: theme.display, fontSize: 64, textTransform: 'uppercase', padding: '6px 28px',
      borderRadius: 10, boxShadow: '0 12px 36px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'}}>{text}</div>
  );
};

/* ---------------------------------------------------------------- image card (comment screenshots etc.) */
export const ImageCard: React.FC<{src: string; y?: number; width?: number; tilt?: number; dur: number}> = ({src, y = 0.36, width: w = 0.86, tilt = -2, dur}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 170, mass: 0.7}});
  const out = useExit(dur, 7);
  return (
    <div style={{position: 'absolute', left: '50%', top: y * height, width: w * width,
      transform: `translate(-50%,-50%) scale(${interpolate(s, [0, 1], [0.55, 1]) * (0.85 + 0.15 * out)}) rotate(${interpolate(s, [0, 1], [tilt * 4, tilt])}deg)`,
      opacity: Math.min(1, s * 2) * out}}>
      <Img src={staticFile(src)} style={{width: '100%', borderRadius: 22, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', border: '3px solid rgba(255,255,255,0.9)'}} />
    </div>
  );
};

/* ---------------------------------------------------------------- callout (circle + arrow + label) */
export const Callout: React.FC<{text: string; x: number; y: number; arrow?: 'up' | 'down' | 'left' | 'right'; circle?: boolean; dur: number}> =
({text, x, y, arrow = 'down', circle = true, dur}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const draw = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lab = spring({frame: frame - 6, fps, config: {damping: 13, stiffness: 220}});
  const out = useExit(dur);
  const px = x * width, py = y * height, r = 90, gap = 230;
  const dir = {up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0]}[arrow];
  // label sits on the far side of the arrow; arrow points at the target
  const lx = px + dir[0] * gap, ly = py + dir[1] * gap;
  const ax1 = px + dir[0] * (gap - 50), ay1 = py + dir[1] * (gap - 50);
  const ax2 = px + dir[0] * (r + 16), ay2 = py + dir[1] * (r + 16);
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {circle ? <circle cx={px} cy={py} r={r} fill="none" stroke={theme.accent} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} transform={`rotate(-90 ${px} ${py})`} /> : null}
        <line x1={ax1} y1={ay1} x2={ax1 + (ax2 - ax1) * draw} y2={ay1 + (ay2 - ay1) * draw} stroke={theme.accent} strokeWidth={10} strokeLinecap="round" />
        {draw > 0.95 ? (() => {
          const ang = Math.atan2(ay2 - ay1, ax2 - ax1);
          const h = 30;
          const p1 = [ax2 - h * Math.cos(ang - 0.5), ay2 - h * Math.sin(ang - 0.5)];
          const p2 = [ax2 - h * Math.cos(ang + 0.5), ay2 - h * Math.sin(ang + 0.5)];
          return <polyline points={`${p1[0]},${p1[1]} ${ax2},${ay2} ${p2[0]},${p2[1]}`} fill="none" stroke={theme.accent} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />;
        })() : null}
      </svg>
      <div style={{position: 'absolute', left: lx, top: ly, transform: `translate(-50%,-50%) scale(${lab})`, background: theme.paper, color: theme.ink,
        fontFamily: theme.display, fontSize: 54, textTransform: 'uppercase', padding: '4px 22px', borderRadius: 8, whiteSpace: 'nowrap',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>{text}</div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- versus banner */
export const Versus: React.FC<{left: string; right: string; leftColor?: string; rightColor?: string; dur: number}> =
({left, right, leftColor = theme.human, rightColor = theme.claude, dur}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 15, stiffness: 160}});
  const v = spring({frame: frame - 6, fps, config: {damping: 9, stiffness: 260, mass: 0.6}});
  const out = useExit(dur);
  const side = (label: string, color: string, from: number): React.CSSProperties & {label?: string} => ({
    flex: 1, background: color, color: theme.ink, fontFamily: theme.display, fontSize: 70, textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120,
    transform: `translateX(${interpolate(s, [0, 1], [from, 0])}%) skewX(-8deg)`,
  });
  return (
    <div style={{position: 'absolute', top: theme.safeTop * height, left: 30, right: 30, display: 'flex', gap: 18, opacity: out, alignItems: 'center'}}>
      <div style={side(left, leftColor, -120)}>{left}</div>
      <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) scale(${interpolate(v, [0, 1], [3, 1])})`, opacity: v > 0.05 ? 1 : 0,
        width: 150, height: 150, borderRadius: 75, background: theme.ink, border: `6px solid ${theme.paper}`, color: theme.paper,
        fontFamily: theme.display, fontSize: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2}}>VS</div>
      <div style={side(right, rightColor, 120)}>{right}</div>
    </div>
  );
};

/* ---------------------------------------------------------------- speed tag */
export const SpeedTag: React.FC<{text: string; dur: number}> = ({text, dur}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 14, stiffness: 220}});
  const out = useExit(dur);
  const pulse = 1 + 0.04 * Math.sin(frame / 3);
  return (
    <div style={{position: 'absolute', right: theme.safeRight * width, top: (theme.safeTop + 0.09) * height, opacity: Math.min(s, out),
      transform: `scale(${s * pulse})`, display: 'flex', alignItems: 'center', gap: 12, fontFamily: theme.mono, fontWeight: 700,
      fontSize: 52, color: theme.paper, background: 'rgba(10,10,11,0.7)', padding: '8px 22px', borderRadius: 14}}>
      <span style={{color: theme.accent, letterSpacing: -10}}>▶▶</span>{text}
    </div>
  );
};

/* ---------------------------------------------------------------- full-screen title / chapter card */
export const TitleCard: React.FC<{kicker?: string; text: string; dur: number}> = ({kicker, text, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const wipe = interpolate(frame, [0, 8], [0, 100], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const outW = interpolate(frame, [dur - 8, dur], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const s = spring({frame: frame - 5, fps, config: {damping: 14, stiffness: 200}});
  return (
    <AbsoluteFill style={{clipPath: `inset(${outW}% 0 0 0)`}}>
      <AbsoluteFill style={{background: theme.ink, clipPath: `inset(0 ${100 - wipe}% 0 0)`, alignItems: 'center', justifyContent: 'center', padding: 70}}>
        {kicker ? <div style={{fontFamily: theme.mono, fontWeight: 700, fontSize: 36, letterSpacing: 8, color: theme.accent, marginBottom: 26, opacity: s}}>{kicker}</div> : null}
        <div style={{fontFamily: theme.display, fontSize: 150, lineHeight: 0.98, color: theme.paper, textTransform: 'uppercase', textAlign: 'center',
          transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px)`, opacity: s}}>{text}</div>
        <div style={{width: `${interpolate(s, [0, 1], [0, 40])}%`, height: 10, background: theme.accent, marginTop: 34, borderRadius: 5}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- end card */
export const EndCard: React.FC<{text: string; sub?: string; dur: number}> = ({text, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bg = interpolate(frame, [0, 10], [0, 0.78], {extrapolateRight: 'clamp'});
  const s = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 180}});
  return (
    <AbsoluteFill style={{background: `rgba(10,10,11,${bg})`, alignItems: 'center', justifyContent: 'center', padding: 80}}>
      <div style={{fontFamily: theme.display, fontSize: 120, lineHeight: 1, color: theme.paper, textTransform: 'uppercase', textAlign: 'center',
        transform: `scale(${interpolate(s, [0, 1], [1.4, 1])})`, opacity: s, ...stroke(6)}}>{text}</div>
      {sub ? <div style={{fontFamily: theme.body, fontWeight: 900, fontSize: 46, color: theme.accent, marginTop: 30, opacity: s}}>{sub}</div> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- flash + progress */
export const Flash: React.FC<{color?: string}> = ({color = '#fff'}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{background: color, opacity: interpolate(frame, [0, 6], [0.9, 0], {extrapolateRight: 'clamp'})}} />;
};

export const Progress: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  return <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(frame / dur) * 100}%`, background: theme.accent}} />;
};
