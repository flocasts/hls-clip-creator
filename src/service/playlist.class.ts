import * as HLS from 'hls-parser';
import { Rendition } from './rendition.class';
import * as http from 'https'
import * as https from 'https'
import s3service, { S3ObjectOutput } from './s3.service.class';

export enum PlaylistType {
    "VideoAndAudio",
    "AudioOnly",
    "VideoOnly"
}

export class Playlist {

    protected m3u8: HLS.iMasterPlaylist;
    protected renditions: Rendition[] = [];
    protected type: PlaylistType = PlaylistType.VideoAndAudio;

    protected constructor(body: string) {
        let m3u8: HLS.iGenericPlaylist = HLS.parse(body);
        let playlist: Playlist = this;
        if (!m3u8.isMasterPlaylist) {
            throw new Error("This m3u8 is not a master playlist.");
        }
        this.m3u8 = <HLS.iMasterPlaylist> m3u8;
        this.m3u8.variants.forEach(function (variant: HLS.iVariant) {
            let rendition: Rendition = new Rendition(playlist, variant);
            playlist.renditions.push(rendition);
        })
    }

    static loadFromString(body: string): Playlist {
        return new Playlist(body);
    }

    static loadFromS3(bucket: string, key: string) {
        return s3service.getObject(bucket, key)
            .then((s3Object: S3ObjectOutput) => {
                const playlist = new Playlist(s3Object.Body.toString());
                
                playlist.m3u8.uri = key;

                return playlist;
            });
    }

    public includeAudio(): boolean {
        return (
            this.type == PlaylistType.VideoAndAudio ||
            this.type == PlaylistType.AudioOnly
        );
    }

    public includeVideo(): boolean {
        return (
            this.type == PlaylistType.VideoAndAudio ||
            this.type == PlaylistType.VideoOnly
        );
    }

    public getRenditions(): Rendition[] {
        return this.renditions;
    }

    public getUri(): string {
        return this.m3u8.uri;
    }

    public getUriPath(): string {
        return this.getUri().split('/').slice(0, -1).join('/');
    }
}