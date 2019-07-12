import Bluebird from 'bluebird';
import fs from 'fs';
import s3service from './s3.service.class';
import { Playlist } from './playlist.class'
import logger from '../logger';

interface ClipBodyMeta {
    [key: string]: any;
}

export interface ClipBody {
    streamId: number;
    in: number;
    out: number;
    meta: ClipBodyMeta;
    webhook?: string;
}

export class HlsClipCreator {
    private clipBody: ClipBody;
    private bucket = 'flosports-video-stag';

    constructor(clipBody: ClipBody) {
        this.clipBody = clipBody;
    }

    public copyStreamToLocal() {
        return Playlist.loadFromS3(this.bucket, `streams/${this.clipBody.streamId}/a/playlist.m3u8`)
            .then((playlist: Playlist) => this.downloadChunklistsFromPlaylist(playlist));
    }

    protected async downloadChunklistsFromPlaylist(playlist: Playlist) {
        const startDate = new Date(this.clipBody.in);
        const endDate = new Date(this.clipBody.out);
        const playlistUriPath = playlist.getUriPath();
        const paths = [];

        startDate.setHours(startDate.getHours() - 1);
        endDate.setHours(endDate.getHours() + 1);

        const queryParts = [
            `Contents[?LastModifiedString>=\`${startDate.toISOString()}\`]`,
            `[?LastModifiedString>=\`${endDate.toISOString()}\`]`,
            `[?contains(Key, '_chunklist_')][].Key`
        ];
        const query = queryParts.join('|');

        for (const rendition of playlist.getRenditions()) {
            paths.push([playlistUriPath, rendition.getUriPath()].join('/'));
        }

        try {
            fs.mkdirSync('streams');
            fs.mkdirSync(playlistUriPath.split('/').slice(0,-1).join('/'));
            fs.mkdirSync(playlistUriPath);
        } catch(err) {

        }

        await Bluebird.map(paths, async (path: string, idx) => {
            logger.debug(`Running ${idx}: ${path}`);

            await s3service.queryObjects('flosports-video-stag', path, query)
                .then(async (chunklists: string[]) => {
                    try {
                        fs.mkdirSync(path);
                    } catch(err) {

                    }

                    await this.downloadChunklists(chunklists);
                });
            
            logger.debug(`Done ${idx}: ${path}`);
        }, {
            concurrency: 3
        });
    }

    protected async downloadChunklists(chunklistKeys: string[]) {
        await Bluebird.map(chunklistKeys, async (key: string) => {
            const file = fs.createWriteStream(key);

            logger.debug(`Downloading ${key}...`);
    
            await new Promise((resolve) => {
                s3service.getObjectReadStream(this.bucket, key)
                    .on('end', () => {
                        resolve();
                    })
                    .pipe(file);
            });
        }, {
            concurrency: 10
        });
    }
}