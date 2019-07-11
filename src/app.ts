import logger from './logger';
// import { Chunklist } from './service/chunklist.class';
import s3service from './service/s3.service.class';

// Chunklist.loadFromUrl('https://staging-cdn-florigin.flofc.com/streams/9588/a/3000/258828854_chunklist_vo.m3u8')
// .then((chunklist: Chunklist) => {
//     logger.debug(chunklist.getSegments());
// });

s3service.queryObjects('flosports-video-stag', 'streams/5486/a/1000/',
"Contents[?LastModifiedString>=`2018-10-28T00:06:15.000Z`] | [?contains(Key, 'm3u8')][].Key"
)
.then((results) => {
    logger.debug(results);
});