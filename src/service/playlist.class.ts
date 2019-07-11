import * as HLS from 'hls-parser';
import { Rendition } from './rendition.class';

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
}