#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsDemoStack } from '../lib/aws-demo-stack';

const app = new cdk.App();
new AwsDemoStack(app, 'AwsDemoStack');
