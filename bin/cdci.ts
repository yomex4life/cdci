#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdciStack } from '../lib/cdci-stack';
import { PipelineStack } from '../lib/pipeline';

const app = new cdk.App();
new CdciStack(app, 'CdciStack', {
  
});

new PipelineStack(app, 'PipelineStack', {});