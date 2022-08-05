import { Construct } from "constructs";
import {Canary, Runtime, Schedule, Test, Code} from "@aws-cdk/aws-synthetics-alpha";
import { Duration } from "aws-cdk-lib";
import { join } from 'path';
import * as fs from 'fs';


interface ServiceHealthCanaryProps
{
    apiEndpoint: string;
    canaryName: string;
}

export class ServiceHealthCanary extends Construct{    
    constructor(scope: Construct, id: string, props: ServiceHealthCanaryProps) {
        super(scope, id);

        new Canary(this, props.canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_5,
            canaryName: props.canaryName,
            schedule: Schedule.rate(Duration.minutes(1)),
            environmentVariables: {
                API_ENDPOINT: props.apiEndpoint,
                DEPLOYMENT_TRIGGER: Date.now().toString(),
            },
            test: Test.custom({
                code: Code.fromInline(fs.readFileSync(join(__dirname, "../../canary/canary.ts"), "utf8")),
                handler: "index.handler"
            }),
            timeToLive: Duration.minutes(5)
        })
    }
}