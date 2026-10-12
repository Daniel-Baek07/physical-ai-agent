import React from 'react';
import {CalculateMetadataFunction, Composition, continueRender, delayRender} from 'remotion';
import '@fontsource/anton';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/700.css';
import {Short} from './Short';
import {Edit, clipDuration} from './types';

const fontHandle = typeof document !== 'undefined' ? delayRender('fonts') : null;
if (typeof document !== 'undefined') {
  Promise.all([
    document.fonts.load('104px Anton'),
    document.fonts.load('900 40px Inter'),
    document.fonts.load('700 40px "JetBrains Mono"'),
  ]).then(() => fontHandle !== null && continueRender(fontHandle)).catch(() => fontHandle !== null && continueRender(fontHandle));
}

const calc: CalculateMetadataFunction<Edit> = ({props}) => {
  const fps = props.fps ?? 30;
  const total = props.timeline.reduce((a, c) => a + Math.max(1, Math.round(clipDuration(c) * fps)), 0);
  return {fps, durationInFrames: Math.max(1, total), width: props.width ?? 1080, height: props.height ?? 1920};
};

const demo: Edit = {timeline: [{src: '_kit/demo.png', freeze: undefined, in: 0, out: 3}], overlays: [{type: 'hook', start: 0, end: 3, text: 'drop an edit.json in', highlight: ['edit.json']}]};

export const Root: React.FC = () => (
  <Composition id="Short" component={Short} defaultProps={demo} calculateMetadata={calc} fps={30} width={1080} height={1920} durationInFrames={90} />
);
