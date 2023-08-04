import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {LoadBalancerTarget} from "aws-cdk-lib/aws-route53-targets";
import {ApplicationProtocol} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {ApplicationLoadBalancedFargateService} from 'aws-cdk-lib/aws-ecs-patterns';
import {Cluster, ContainerImage, DeploymentControllerType, LogDrivers} from "aws-cdk-lib/aws-ecs";
import {SubnetType, Vpc} from 'aws-cdk-lib/aws-ec2';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {Effect, PolicyStatement} from "aws-cdk-lib/aws-iam";

export type ApiStackProps = {
    certificateDomainNameParameterName: string;
    hostedZoneIdParameterName: string;
    hostedZoneNameParameterName: string;
    aRecordNameParameterName: string;
} & cdk.StackProps;

export class DeploymentApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        // Retrieve parameters from AWS Systems Manager Parameter Store
        const certificateDomainName = StringParameter.fromStringParameterName(this, 'CertificateDomainName', props.certificateDomainNameParameterName);
        const hostedZoneId = StringParameter.fromStringParameterName(this, 'HostedZoneId', props.hostedZoneIdParameterName);
        const hostedZoneName = StringParameter.fromStringParameterName(this, 'HostedZoneName', props.hostedZoneNameParameterName);
        const aRecordName = StringParameter.fromStringParameterName(this, 'ARecordName', props.aRecordNameParameterName);

        const publicZone = HostedZone.fromHostedZoneAttributes(
            this,
            "HttpsFargateAlbPublicZone",
            {
                zoneName: hostedZoneName.stringValue,
                hostedZoneId: hostedZoneId.stringValue,
            }
        );

        const certificate = new Certificate(this, "ApiHttpsFargateAlbCertificate", {
            domainName: certificateDomainName.stringValue,
            validation: CertificateValidation.fromDns(publicZone),
        });


        const vpc = new Vpc(this, "ApiVpc", {
            natGateways: 1,
            subnetConfiguration: [
                {cidrMask: 24, subnetType: SubnetType.PUBLIC, name: "Public"},
                {cidrMask: 24, subnetType: SubnetType.PRIVATE_WITH_EGRESS, name: "Private"}
            ],
            maxAzs: 3
        });

        const cluster = new Cluster(this, 'ApiCluster', {
            vpc,
            containerInsights: true
        });

        const image = ContainerImage.fromRegistry('914698808609.dkr.ecr.eu-west-1.amazonaws.com/api-pipeline-images:latest');

        const ecrPolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:GetRepositoryPolicy',
                'ecr:DescribeRepositories',
                'ecr:ListImages',
                'ecr:DescribeImages',
                'ecr:BatchGetImage',
            ],
            resources: ['*'],
        });

        const fargate = new ApplicationLoadBalancedFargateService(this, 'ApiAlbFargate', {
            cluster,
            taskImageOptions: {
                image,
                containerPort: 80,
                logDriver: LogDrivers.awsLogs({
                    streamPrefix: id,
                    logRetention: RetentionDays.ONE_MONTH,
                }),
            },
            assignPublicIp: true,
            memoryLimitMiB: 512,
            cpu: 256,
            desiredCount: 1,
            deploymentController: {type: DeploymentControllerType.ECS},
            protocol: ApplicationProtocol.HTTPS,
            certificate,
            redirectHTTP: true,
        });

        fargate.taskDefinition.addToExecutionRolePolicy(ecrPolicyStatement); // Attach the policy to the task execution role

        new ARecord(this, "ApiHttpsFargateAlbARecord", {
            zone: publicZone,
            recordName: aRecordName.stringValue,
            target: RecordTarget.fromAlias(
                new LoadBalancerTarget(fargate.loadBalancer)
            ),
        });
    }
}
