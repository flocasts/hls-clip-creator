import * as HLS from 'hls-parser';
import { Segment } from './segment.class'
import * as http from 'https'
import * as https from 'https'

export class Chunklist {
    protected m3u8: HLS.iMediaPlaylist;
    protected segments: Segment[] = [];
    protected totalDuration: number = 0;
    protected maxDuration: number = -1;

    protected constructor(body: string) {
        let m3u8: HLS.iGenericPlaylist = HLS.parse(body);
        if (m3u8.isMasterPlaylist) {
            throw new Error("This m3u8 is a master playlist.");
        }
        this.m3u8 = <HLS.iMediaPlaylist> m3u8;
        this.loadSegments();
    }

    static loadFromString(body: string): Chunklist {
        return new Chunklist(body);
    }

    static loadFromUrl(url: string): Promise<Chunklist> {
        return new Promise(function (resolve, reject) {
            Chunklist.fetch(url).then((body: string) => {
                resolve(new Chunklist(body));
            }).catch((err) => {
                reject(err);
            });
        });
    }

    static fetch(url: string): Promise<string> {
        return new Promise(function (resolve, reject) {
            try {
                const parsedUrl: URL = new URL(url);
                const options = {
                    hostname: parsedUrl.hostname,
                    port: parsedUrl.port,
                    path: parsedUrl.pathname,
                    method: 'GET'
                }
                const req = (parsedUrl.protocol == 'https:' ? https : http).request(options, (res) => {
                    let body: string = '';
                    res.on('data', (d) => {
                        body += d;
                    });
                    res.on('end', () => {
                        if (typeof res == 'undefined' || typeof res.statusCode == 'undefined') {
                            return reject('Invalid http response');
                        }
                        if (res.statusCode >= 200 && res.statusCode <= 299 && body) {
                            resolve(body);
                        }
                        else {
                            reject("Unexpected http response: " + res.statusCode);
                        }
                    })
                })
                req.on('error', (err) => {
                    reject("Could not load url: " + err);
                })
                req.end()
            }
            catch (ex) {
                reject(ex);
            }
        });
    }

    public getSegments(): Segment[] {
        return this.segments;
    }

    protected loadSegments() {
        for (const iSegment of this.m3u8.segments) {
            let segment: Segment = new Segment(iSegment);
            this.segments.push(segment);
            this.totalDuration += segment.getDuration();
        }
    }
}