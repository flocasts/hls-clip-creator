import { S3 } from 'aws-sdk';
import jmespath from 'jmespath';
import logger from '../logger';

export class S3Service {
    private s3: S3;

    constructor() {
        this.s3 = new S3();
    }

    public async queryObjects(bucket: string, prefix: string, query: string) {
        let continuationToken: undefined|string;
        let results: S3.ObjectList = [];
        
        do {
            const data: S3.ListObjectsV2Output = await this._listObjects(bucket, prefix, continuationToken);

            if (!data || !data.Contents) {
                logger.debug('No data');
                break;
            }

            data.Contents.forEach((item) => {
                if (item.LastModified) {
                    item.LastModifiedString = item.LastModified.toISOString();
                }
            });

            results = results.concat(
                            jmespath.search(data, query)
                        );

            continuationToken = data.NextContinuationToken;
        } while (continuationToken);

        return results;
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