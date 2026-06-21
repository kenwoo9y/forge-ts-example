#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { ApiStack } from '../lib/stacks/api-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { type EnvResources, PipelineStack } from '../lib/stacks/pipeline-stack';
import { WebStack } from '../lib/stacks/web-stack';

// ─── ユーティリティ ─────────────────────────────────────────────────────────

function envInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val !== undefined ? parseInt(val, 10) : defaultValue;
}

function isEnabled(app: cdk.App, key: string): boolean {
  const val = app.node.tryGetContext(key);
  return val === true || val === 'true';
}

// ─── デフォルト設定（全環境共通・最小コスト）────────────────────────────────
// 環境ごとに増強する場合は DEV_API_CPU / STG_API_CPU / PROD_API_CPU 等の
// 環境変数で上書きする

type EnvName = 'dev' | 'stg' | 'prod';

const DEFAULT_API_CPU = 256;
const DEFAULT_API_MEMORY = 512;
const DEFAULT_API_COUNT = 1;
const DEFAULT_WEB_CPU = 256;
const DEFAULT_WEB_MEMORY = 512;
const DEFAULT_WEB_COUNT = 1;
const DEFAULT_DB_TYPE = 't3.micro';
const DEFAULT_DB_STORAGE = 20;
const DEFAULT_DB_MAX_STORAGE = 100;

// ─── 環境インフラ生成ファクトリ ──────────────────────────────────────────────

const placeholderImage = ecs.ContainerImage.fromRegistry(
  'public.ecr.aws/nginx/nginx:stable-alpine'
);

// nginx のデフォルト設定（ポート80）を指定ポートで上書きして起動する
// Docker ビルド不要でヘルスチェックを通過させるためのシェルコマンド
function placeholderCommand(port: number): string[] {
  return [
    '/bin/sh',
    '-c',
    `echo 'server{listen ${port};location /{return 200;}}' > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'`,
  ];
}

function createEnvInfra(app: cdk.App, envName: EnvName, env: cdk.Environment): EnvResources {
  const E = envName.toUpperCase();
  const P = envName.charAt(0).toUpperCase() + envName.slice(1); // 'Dev' | 'Stg' | 'Prod'

  const networkStack = new NetworkStack(app, `${P}NetworkStack`, {
    env,
    enableVpcEndpoints: envName !== 'dev',
  });
  const databaseStack = new DatabaseStack(app, `${P}DatabaseStack`, {
    env,
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
    instanceType: new ec2.InstanceType(process.env[`${E}_DB_INSTANCE_TYPE`] ?? DEFAULT_DB_TYPE),
    allocatedStorage: envInt(`${E}_DB_ALLOCATED_STORAGE`, DEFAULT_DB_STORAGE),
    maxAllocatedStorage: envInt(`${E}_DB_MAX_ALLOCATED_STORAGE`, DEFAULT_DB_MAX_STORAGE),
  });

  const jwtSecret = new secretsmanager.Secret(networkStack, `${P}JwtSecret`, {
    secretName: `${envName}/jwt-secret`,
  });

  const dbName = process.env.POSTGRES_DB;
  if (!dbName) throw new Error('POSTGRES_DB environment variable is required');

  const apiStack = new ApiStack(app, `${P}ApiStack`, {
    env,
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
    database: databaseStack.database,
    databaseCredentials: databaseStack.credentials,
    jwtSecret,
    dbName,
    image: placeholderImage,
    command: placeholderCommand(3000),
    cpu: envInt(`${E}_API_CPU`, DEFAULT_API_CPU),
    memoryLimitMiB: envInt(`${E}_API_MEMORY_MIB`, DEFAULT_API_MEMORY),
    desiredCount: envInt(`${E}_API_DESIRED_COUNT`, DEFAULT_API_COUNT),
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  const webStack = new WebStack(app, `${P}WebStack`, {
    env,
    vpc: networkStack.vpc,
    apiUrl: `http://${apiStack.ecsFargateService.loadBalancer.loadBalancerDnsName}`,
    image: placeholderImage,
    command: placeholderCommand(3001),
    cpu: envInt(`${E}_WEB_CPU`, DEFAULT_WEB_CPU),
    memoryLimitMiB: envInt(`${E}_WEB_MEMORY_MIB`, DEFAULT_WEB_MEMORY),
    desiredCount: envInt(`${E}_WEB_DESIRED_COUNT`, DEFAULT_WEB_COUNT),
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  return { apiStack, webStack };
}

// ─── アプリ ──────────────────────────────────────────────────────────────────

const app = new cdk.App();

const cdkEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const enableStg = isEnabled(app, 'enableStg');
const enableProd = isEnabled(app, 'enableProd');

const ecrStack = new EcrStack(app, 'EcrStack', { env: cdkEnv, enableStg, enableProd });

const dev = createEnvInfra(app, 'dev', cdkEnv);
const stg = enableStg ? createEnvInfra(app, 'stg', cdkEnv) : undefined;
const prod = enableProd ? createEnvInfra(app, 'prod', cdkEnv) : undefined;

const githubOrg = (app.node.tryGetContext('githubOrg') as string | undefined) ?? '';
const githubRepo = (app.node.tryGetContext('githubRepo') as string | undefined) ?? '';

new PipelineStack(app, 'PipelineStack', {
  env: cdkEnv,
  githubOrg,
  githubRepo,
  ecrStack,
  dev,
  stg,
  prod,
});
