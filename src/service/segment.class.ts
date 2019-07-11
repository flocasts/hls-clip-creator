import * as HLS from 'hls-parser';

export class Segment {

    protected segment: HLS.iSegment;

    constructor(segment: HLS.iSegment) {
        this.segment = segment;
    }

    public getMediaSequenceNumber(): number {
        return this.segment.mediaSequenceNumber;
    }

    public getDuration(): number {
        return this.segment.duration;
    }

    public cloneWithDiscontinuity(discontinuity: boolean): Segment {
        const segment: HLS.iSegment = JSON.parse(JSON.stringify(this.segment));
        segment.discontinuity = discontinuity;

        return new Segment(segment);
    }

    public toString(): string {
        let out: string = '';
        let duration: string;

        if (this.segment.programDateTime) {
            out += "#EXT-X-PROGRAM-DATE-TIME:" + this.segment.programDateTime.toISOString() + "\n";
        }
        if (this.segment.discontinuity) {
            out += "#EXT-X-DISCONTINUITY\n";
        }
        if (this.segment.duration % 1 === 0) {
            duration = this.segment.duration.toFixed(1);
        } else {
            duration = this.segment.duration.toString();
        }
        out += "#EXTINF:" + duration + ",\n";
        if (this.segment.byterange) {
            out += "#EXT-X-BYTERANGE:" + this.segment.byterange.length + "@" + this.segment.byterange.offset + "\n";
        }

        out += this.segment.uri + "\n";

        return out;
    }

    protected propertiesToCommaSeparated(properties: any[]): string {
        let out: string = '';
        for (let i: number = 0; i < properties.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += properties[i].join('=');
        }
        return out;
    }
}