#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DeploymentApiStack } from '../lib/deployment-api-stack';

const app = new cdk.App();
new DeploymentApiStack(app, 'DeploymentApiStack', {
    certificateDomainNameParameterName: '/api/certificateDomainName',
    hostedZoneIdParameterName: '/api/hostedZoneId',
    hostedZoneNameParameterName: '/api/hostedZoneName',
    aRecordNameParameterName: '/api/aRecordName',
});
