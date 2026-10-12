// Channel look. Change these and every video changes.
export const theme = {
  ink: '#0A0A0B',
  paper: '#F4F1EA',
  accent: '#FF5A1F',     // "12V orange": hooks, active caption word, counters
  human: '#4DA3FF',      // HUMAN side in versus videos
  claude: '#E07A50',     // CLAUDE side
  good: '#3DDC97',
  display: 'Anton, Impact, sans-serif',   // big hook / caption type
  body: 'Inter, Helvetica, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
  // TikTok/Reels/Shorts safe zone (fraction of height/width)
  safeTop: 0.11,
  safeBottom: 0.22,
  safeRight: 0.13,
};

export const grades: Record<string, string> = {
  none: 'none',
  punchy: 'contrast(1.12) saturate(1.18) brightness(1.02)',
  cool: 'contrast(1.08) saturate(1.05) hue-rotate(-6deg) brightness(1.0)',
  warm: 'contrast(1.06) saturate(1.12) sepia(0.12)',
  mono: 'grayscale(1) contrast(1.2)',
};
