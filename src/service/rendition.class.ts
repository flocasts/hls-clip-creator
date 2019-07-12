import * as HLS from 'hls-parser'
import { Playlist } from './playlist.class'
import { StreamInfo } from './stream.info.class';
import { MediaTrack } from './media.track.class';

export enum RenditionType {
    "video",
    "audio",
    "iframe"
}

export class Rendition {

    protected variant: HLS.iVariant;
    protected streamInfo: StreamInfo;
    protected playlist: Playlist;

    constructor(playlist: Playlist, variant: HLS.iVariant) {
        this.variant = variant;
        this.streamInfo = new StreamInfo(playlist, variant);
        this.playlist = playlist;
    }

    public getTracks(): MediaTrack[] {
        return this.streamInfo.getTracks();
    }

    public getType(): RenditionType {
        if (this.variant.isIFrameOnly) {
            return RenditionType.iframe;
        }
        else if (this.streamInfo.hasAudio() && !this.streamInfo.hasVideo()) {
            return RenditionType.audio;
        }
        else {
            return RenditionType.video;
        }
    }

    public getHeight(): number {
        return this.variant.resolution.height;
    }

    public getFrameRate(): number {
        return this.variant.frameRate;
    }

    public getBandwidth(): number {
        return this.variant.bandwidth;
    }

    public getAverageBandwidth(): number {
        return this.variant.averageBandwidth;
    }

    public getUri(): string {
        return this.variant.uri;
    }

    public getUriPath(): string {
        return this.getUri().split('/').slice(0, -1).join('/');
    }

    public toString(): string {
        let out: string = '';
        out += this.streamInfo.toString();
        if (this.variant.isIFrameOnly) {
            return out;
        }
        out += this.variant.uri + "\n";

        return out;
    }
}