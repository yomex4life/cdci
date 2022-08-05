import { Construct } from "constructs";
import { Bucket, IBucket } from "aws-cdk-lib/aws-s3";
import { RemovalPolicy } from "aws-cdk-lib";

export class CreateSthree extends Construct{

    public readonly s3bucket: IBucket

    constructor(scope: Construct, id: string) {
        super(scope, id);


        this.s3bucket = new Bucket(this, 'MyFirstBucket', {
            bucketName: '4life-cdk-cloudfront-s3',
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true
          });
    }
}