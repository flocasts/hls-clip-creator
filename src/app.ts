// import logger from './logger';
import { HlsClipCreator, ClipBody } from './service/hls.clip.creator.class';

const clip: ClipBody = {
    streamId: 9588,
    in: 1553002898000,
    out: 1553002948169,
    meta: {}
}

const clipCreator = new HlsClipCreator(clip);
clipCreator.copyStreamToLocal();