#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdciStack } from '../lib/cdci-stack';
import { MyPipelineStack } from '../lib/pipeline';

const app = new cdk.App();


const myPipelineStack = new MyPipelineStack(app, 'MyPipelineStack', {});
const serviceStack = new CdciStack(app, 'CdciStack', {
  
});

myPipelineStack.addServiceStage(serviceStack, "Prod");