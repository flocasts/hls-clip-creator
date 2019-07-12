import { S3 } from 'aws-sdk';
import jmespath from 'jmespath';
import logger from '../logger';
import * as stream from 'stream';

export interface S3ObjectWithLastModifiedString extends S3.Object {
    LastModifiedString?: string
}

export interface S3ObjectOutput extends S3.Types.GetObjectOutput {
    Body: S3.Types.Body; // we know it'll exist when using this type
}

export class S3Service {
    private s3: S3;

    constructor() {
        this.s3 = new S3();
    }

    public getObject(bucket: string, key: S3.ObjectKey): Promise<S3ObjectOutput> {
        return new Promise((resolve, reject) => {
            this.s3.getObject({
                Bucket: bucket,
                Key: key,
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }

                if (!data.Body) {
                    return reject('Object has no body');
                }

                return resolve(<S3ObjectOutput>data);
            });
        });
    }

    public getObjectReadStream(bucket: string, key: S3.ObjectKey): stream.Readable {
        return this.s3.getObject({
            Bucket: bucket,
            Key: key,
        }).createReadStream();
    }

    public async queryObjects(bucket: string, prefix: string, query: string) {
        let continuationToken: undefined|string;
        let chunklistKeys: string[] = [];
        
        do {
            const data: S3.ListObjectsV2Output = await this._listObjects(bucket, prefix, continuationToken);

            if (!data || !data.Contents) {
                logger.debug('No data');
                break;
            }

            const clonedData: {Contents: S3ObjectWithLastModifiedString[]} = {
                Contents: []
            }

            for (const item of data.Contents) {
                const clonedItem = <S3ObjectWithLastModifiedString> Object.assign({}, item);
                if (clonedItem.LastModified) {
                    clonedItem.LastModifiedString = clonedItem.LastModified.toISOString();
                }

                clonedData.Contents.push(clonedItem);
            }

            chunklistKeys = chunklistKeys.concat(
                            jmespath.search(clonedData, query)
                        );

            continuationToken = data.NextContinuationToken;
        } while (continuationToken);

        return chunklistKeys;
    }

    protected _listObjects(bucket: string, prefix: string, continuationToken?: string): Promise<S3.ListObjectsV2Output> {
        const params: S3.ListObjectsV2Request = {
            Bucket: bucket,
            Prefix: prefix
        };

        if (continuationToken) {
            params.ContinuationToken = continuationToken;
        }

        return new Promise((resolve, reject) => this.s3.listObjectsV2(params, function(err, data) {
            if (err) {
                reject(err);
            }

            return resolve(data);
        }));
    }
}

export default new S3Service();