import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setConcurrency(Number(process.env.KIT_CONCURRENCY ?? 2));
Config.setCodec('h264');
Config.setCrf(Number(process.env.KIT_CRF ?? 18));
Config.setPixelFormat('yuv420p');
if (process.env.KIT_BROWSER) {
  Config.setBrowserExecutable(process.env.KIT_BROWSER);
}
