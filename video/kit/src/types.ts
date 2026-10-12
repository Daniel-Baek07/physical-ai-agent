// The edit file (edit.json) that describes one video. All overlay times are
// OUTPUT seconds (seconds into the finished video). Clip in/out/at are SOURCE
// seconds (seconds into that clip file).

export type Enter = 'cut' | 'zoom' | 'whip' | 'flash' | 'glitch';

export type Punch = {
  at: number;      // output seconds, relative to the start of THIS clip
  dur?: number;    // seconds the punch-in lasts (default 0.8)
  scale?: number;  // default 1.35
  x?: number;      // 0..1 point to zoom toward (default 0.5)
  y?: number;
};

export type ClipItem = {
  src: string;           // path inside the project folder, e.g. "clips/IMG_1234.mp4"
  in?: number;           // source seconds (default 0)
  out?: number;          // source seconds (required unless freeze)
  speed?: number;        // playback rate (default 1). 8 = 8x
  freeze?: number;       // if set: hold this SOURCE second as a still ...
  hold?: number;         // ... for this many output seconds
  fit?: 'cover' | 'contain' | 'blur';  // blur = contain over a blurred copy (good for landscape clips)
  focusX?: number;       // cover crop focus 0..1 (default 0.5)
  focusY?: number;
  zoom?: number;         // constant zoom (default 1)
  drift?: number;        // slow Ken-Burns zoom amount over the clip, e.g. 0.06
  volume?: number;       // default 1 (0 = mute). Sped-up clips are muted automatically
  enter?: Enter;         // transition INTO this clip (default 'cut')
  punch?: Punch[];
  grade?: 'none' | 'punchy' | 'cool' | 'warm' | 'mono';
};

export type CaptionWord = {t: number; text: string; end?: number};

export type Overlay =
  | {type: 'hook'; start: number; end: number; text: string; highlight?: string[]; y?: number; size?: number}
  | {type: 'captions'; words: CaptionWord[]; y?: number; perChunk?: number}
  | {type: 'counter'; start: number; end: number; from: number; to: number; label: string;
     countStart?: number; countEnd?: number; x?: number; y?: number; suffix?: string}
  | {type: 'badge'; start: number; end: number; text: string; x?: number; y?: number; color?: string}
  | {type: 'image'; start: number; end: number; src: string; y?: number; width?: number; tilt?: number}
  | {type: 'callout'; start: number; end: number; text: string; x: number; y: number;
     arrow?: 'up' | 'down' | 'left' | 'right'; circle?: boolean}
  | {type: 'vs'; start: number; end: number; left: string; right: string; leftColor?: string; rightColor?: string}
  | {type: 'speed'; start: number; end: number; text: string}
  | {type: 'title'; start: number; end: number; kicker?: string; text: string}
  | {type: 'flash'; at: number; color?: string}
  | {type: 'progress'; start?: number; end?: number}
  | {type: 'endcard'; start: number; end: number; text: string; sub?: string};

export type Sfx = {at: number; name: string; volume?: number};

export type Edit = {
  title?: string;
  fps?: number;
  width?: number;
  height?: number;
  timeline: ClipItem[];
  overlays?: Overlay[];
  sfx?: Sfx[];          // extra sound effects; auto ones come from hooks/whips/pops
  autoSfx?: boolean;    // default true
  music?: {src: string; volume?: number; start?: number};
  look?: {vignette?: boolean; grain?: boolean; grade?: ClipItem['grade']};
};

export const clipDuration = (c: ClipItem): number => {
  if (c.freeze !== undefined) return c.hold ?? 1;
  const speed = c.speed ?? 1;
  return Math.max(0, ((c.out ?? 0) - (c.in ?? 0)) / speed);
};
