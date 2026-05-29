#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { ApiStack } from '../lib/stacks/api-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';
import { WebStack } from '../lib/stacks/web-stack';

function envInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val !== undefined ? parseInt(val, 10) : defaultValue;
}

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const networkStack = new NetworkStack(app, 'NetworkStack', {
  env,
  maxAzs: envInt('MAX_AZS', 2),
});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  rdsSecurityGroup: networkStack.rdsSecurityGroup,
  instanceType: new ec2.InstanceType(process.env.DB_INSTANCE_TYPE ?? 't3.micro'),
  allocatedStorage: envInt('DB_ALLOCATED_STORAGE', 20),
  maxAllocatedStorage: envInt('DB_MAX_ALLOCATED_STORAGE', 100),
});

const jwtSecret = secretsmanager.Secret.fromSecretNameV2(app, 'JwtSecret', 'jwt-secret');

const ecrStack = new EcrStack(app, 'EcrStack', { env });

// EcrStack は ApiStack / WebStack と独立させる（クロススタック参照を避ける）
// 初回起動用のプレースホルダーイメージを使用し、実際のイメージは CodeDeploy が管理する
const placeholderImage = ecs.ContainerImage.fromRegistry(
  'public.ecr.aws/nginx/nginx:stable-alpine'
);

const apiStack = new ApiStack(app, 'ApiStack', {
  env,
  vpc: networkStack.vpc,
  rdsSecurityGroup: networkStack.rdsSecurityGroup,
  database: databaseStack.database,
  databaseCredentials: databaseStack.credentials,
  jwtSecret,
  cpu: envInt('API_CPU', 256),
  memoryLimitMiB: envInt('API_MEMORY_MIB', 512),
  desiredCount: envInt('API_DESIRED_COUNT', 1),
  image: placeholderImage,
  deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
});

const webStack = new WebStack(app, 'WebStack', {
  env,
  vpc: networkStack.vpc,
  apiUrl: `http://${apiStack.ecsFargateService.loadBalancer.loadBalancerDnsName}`,
  cpu: envInt('WEB_CPU', 256),
  memoryLimitMiB: envInt('WEB_MEMORY_MIB', 512),
  desiredCount: envInt('WEB_DESIRED_COUNT', 1),
  image: placeholderImage,
  deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
});

const githubOrg = (app.node.tryGetContext('githubOrg') as string | undefined) ?? '';
const githubRepo = (app.node.tryGetContext('githubRepo') as string | undefined) ?? '';
const codestarConnectionArn =
  (app.node.tryGetContext('codestarConnectionArn') as string | undefined) ?? '';

new PipelineStack(app, 'PipelineStack', {
  env,
  githubOrg,
  githubRepo,
  codestarConnectionArn,
  apiStack,
  webStack,
  apiRepository: ecrStack.apiRepository,
  webRepository: ecrStack.webRepository,
});
