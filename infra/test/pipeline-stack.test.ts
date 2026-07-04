import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { describe, expect, it } from 'vitest';
import { ApiStack } from '../lib/stacks/api-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';
import { WebStack } from '../lib/stacks/web-stack';

// PipelineStack のテスト用セットアップ
// account/region を指定することで ARN 組み立てを確定的にする
const TEST_ENV = { account: '123456789012', region: 'ap-northeast-1' };

function buildPipelineStack() {
  const app = new cdk.App();

  const networkStack = new NetworkStack(app, 'TestNetworkStack', { env: TEST_ENV });
  const databaseStack = new DatabaseStack(app, 'TestDatabaseStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
    dbName: 'test_db',
  });
  const sharedStack = new cdk.Stack(app, 'TestSharedStack', { env: TEST_ENV });
  const jwtSecret = new secretsmanager.Secret(sharedStack, 'JwtSecret');

  // DEV のみ作成（enableStg/enableProd は指定しない）
  const ecrStack = new EcrStack(app, 'TestEcrStack', { env: TEST_ENV });

  const image = ecs.ContainerImage.fromRegistry('nginx');

  const apiStack = new ApiStack(app, 'TestApiStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
    database: databaseStack.database,
    databaseCredentials: databaseStack.credentials,
    jwtSecret,
    image,
    dbName: 'test_db',
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  const webStack = new WebStack(app, 'TestWebStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    apiUrl: 'http://api.example.com',
    authSecret: new secretsmanager.Secret(sharedStack, 'AuthSecret'),
    image,
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  const pipelineStack = new PipelineStack(app, 'TestPipelineStack', {
    env: TEST_ENV,
    githubOrg: 'acme',
    githubRepo: 'forge',

    ecrStack,
    dev: { apiStack, webStack },
  });

  return Template.fromStack(pipelineStack);
}

describe('PipelineStack', () => {
  // 重いセットアップを一度だけ実行する
  const template = buildPipelineStack();

  // ─── GitHub OIDC ────────────────────────────────────────────────────────────

  describe('GitHub OIDC プロバイダー', () => {
    it('OIDCプロバイダーが1つ作成される', () => {
      template.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 1);
    });

    it('GitHub Actions のエンドポイントが設定される', () => {
      template.hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
        Url: 'https://token.actions.githubusercontent.com',
      });
    });

    it('aud クレームに sts.amazonaws.com が設定される', () => {
      template.hasResourceProperties('Custom::AWSCDKOpenIdConnectProvider', {
        ClientIDList: Match.arrayWith(['sts.amazonaws.com']),
      });
    });
  });

  // ─── OIDC ロール ─────────────────────────────────────────────────────────────

  describe('アプリデプロイ用 OIDC ロール', () => {
    it('ロールが正しい名前で作成される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-app-deploy',
      });
    });

    it('main ブランチへの push に限定した信頼ポリシーが設定される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-app-deploy',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'token.actions.githubusercontent.com:sub': 'repo:acme/forge:ref:refs/heads/main',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    it('ECR push 権限が付与される', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ecr:PutImage']),
            }),
          ]),
        },
        Roles: Match.arrayWith([Match.objectLike({ Ref: Match.anyValue() })]),
      });
    });

    it('GetAuthorizationToken 権限が付与される', () => {
      // 単一アクションは CDK が文字列として生成する
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'EcrAuth',
              Action: 'ecr:GetAuthorizationToken',
              Resource: '*',
            }),
          ]),
        },
      });
    });
  });

  describe('インフラ diff 用 OIDC ロール', () => {
    it('ロールが正しい名前で作成される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-infra-diff',
      });
    });

    it('リポジトリスコープの信頼ポリシーが設定される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-infra-diff',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: Match.objectLike({
                StringLike: Match.objectLike({
                  'token.actions.githubusercontent.com:sub': 'repo:acme/forge:*',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    it('CloudFormation 読み取り権限が付与される', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'CfnRead',
              Action: Match.arrayWith(['cloudformation:DescribeStacks']),
            }),
          ]),
        },
      });
    });

    it('CDK lookup ロールの AssumeRole 権限が付与される', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'CdkLookup',
              Action: 'sts:AssumeRole',
              Resource: 'arn:aws:iam::123456789012:role/cdk-*-lookup-role-*',
            }),
          ]),
        },
      });
    });
  });

  describe('インフラデプロイ用 OIDC ロール', () => {
    it('ロールが正しい名前で作成される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-infra-deploy',
      });
    });

    it('production Environment にスコープされた信頼ポリシーが設定される', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'github-actions-infra-deploy',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'token.actions.githubusercontent.com:sub':
                    'repo:acme/forge:environment:production',
                }),
              }),
            }),
          ]),
        }),
      });
    });

    it('CDK bootstrap ロールへの AssumeRole 権限が付与される', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'CdkDeploy',
              Action: 'sts:AssumeRole',
              Resource: 'arn:aws:iam::123456789012:role/cdk-*',
            }),
          ]),
        },
        Roles: Match.arrayWith([
          Match.objectLike({ Ref: Match.stringLikeRegexp('InfraDeployOidcRole') }),
        ]),
      });
    });
  });

  // ─── CodePipeline ────────────────────────────────────────────────────────────

  describe('パイプライン', () => {
    it('パイプラインが2つ作成される（API・Web）', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 2);
    });

    it('アプリパイプラインがDEVの3ステージで構成される（Source→GenerateDev→DeployDev）', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ApiAppPipeline',
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'GenerateDev' }),
          Match.objectLike({ Name: 'DeployDev' }),
        ]),
      });
    });

    it('ECRソースアクションが設定される（APIパイプライン）', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ApiAppPipeline',
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Source',
                  Provider: 'ECR',
                }),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  // ─── CodeBuild ───────────────────────────────────────────────────────────────

  describe('CodeBuild プロジェクト', () => {
    it('インフラデプロイOIDCロールが CDK bootstrap ロールへの AssumeRole 権限を持つ', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'CdkDeploy',
              Action: 'sts:AssumeRole',
              Resource: 'arn:aws:iam::123456789012:role/cdk-*',
            }),
          ]),
        },
      });
    });

    it('Generate プロジェクトが ECS describe 権限を持つ', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasEcsDescribe = Object.values(policies).some((p) => {
        const statements = p.Properties?.PolicyDocument?.Statement ?? [];
        return statements.some(
          (s: { Action: string | string[] }) =>
            Array.isArray(s.Action) && s.Action.includes('ecs:DescribeServices')
        );
      });
      expect(hasEcsDescribe).toBe(true);
    });
  });

  // ─── CodeDeploy ──────────────────────────────────────────────────────────────

  describe('CodeDeploy', () => {
    it('ECSアプリケーションが2つ作成される（API・Web）', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ComputePlatform: 'ECS',
      });
      // API と Web で合計2つ
      const apps = template.findResources('AWS::CodeDeploy::Application');
      expect(Object.keys(apps).length).toBe(2);
    });

    it('デプロイメントグループが2つ作成される（API・Web）', () => {
      const groups = template.findResources('AWS::CodeDeploy::DeploymentGroup');
      expect(Object.keys(groups).length).toBe(2);
    });

    it('段階的デプロイ設定が使用される（LINEAR_10PERCENT_EVERY_1MINUTES）', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentConfigName: 'CodeDeployDefault.ECSLinear10PercentEvery1Minutes',
      });
    });

    it('デプロイ失敗時の自動ロールバックが有効化される', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE']),
        },
      });
    });

    it('Blue/Green デプロイスタイルが設定される', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentStyle: {
          DeploymentOption: 'WITH_TRAFFIC_CONTROL',
          DeploymentType: 'BLUE_GREEN',
        },
      });
    });
  });
});

// ─── STG 昇格ありのテスト ──────────────────────────────────────────────────────

describe('PipelineStack (enableStg=true)', () => {
  const template = (() => {
    const app = new cdk.App();
    const networkStack = new NetworkStack(app, 'TestNetworkStack', { env: TEST_ENV });
    const databaseStack = new DatabaseStack(app, 'TestDatabaseStack', {
      env: TEST_ENV,
      vpc: networkStack.vpc,
      rdsSecurityGroup: networkStack.rdsSecurityGroup,
      dbName: 'test_db',
    });
    const sharedStack = new cdk.Stack(app, 'TestSharedStack', { env: TEST_ENV });
    const jwtSecret = new secretsmanager.Secret(sharedStack, 'JwtSecret');

    const stgNetworkStack = new NetworkStack(app, 'StgNetworkStack', { env: TEST_ENV });
    const stgDatabaseStack = new DatabaseStack(app, 'StgDatabaseStack', {
      env: TEST_ENV,
      vpc: stgNetworkStack.vpc,
      rdsSecurityGroup: stgNetworkStack.rdsSecurityGroup,
      dbName: 'test_db',
    });
    const stgSharedStack = new cdk.Stack(app, 'StgSharedStack', { env: TEST_ENV });
    const stgJwtSecret = new secretsmanager.Secret(stgSharedStack, 'StgJwtSecret');

    const ecrStack = new EcrStack(app, 'TestEcrStack', { env: TEST_ENV, enableStg: true });
    const image = ecs.ContainerImage.fromRegistry('nginx');

    const apiStack = new ApiStack(app, 'TestApiStack', {
      env: TEST_ENV,
      vpc: networkStack.vpc,
      rdsSecurityGroup: networkStack.rdsSecurityGroup,
      database: databaseStack.database,
      databaseCredentials: databaseStack.credentials,
      jwtSecret,
      image,
      dbName: 'test_db',
      deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
    });
    const webStack = new WebStack(app, 'TestWebStack', {
      env: TEST_ENV,
      vpc: networkStack.vpc,
      apiUrl: 'http://api.example.com',
      authSecret: new secretsmanager.Secret(sharedStack, 'AuthSecret'),
      image,
      deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
    });
    const stgApiStack = new ApiStack(app, 'StgApiStack', {
      env: TEST_ENV,
      vpc: stgNetworkStack.vpc,
      rdsSecurityGroup: stgNetworkStack.rdsSecurityGroup,
      database: stgDatabaseStack.database,
      databaseCredentials: stgDatabaseStack.credentials,
      jwtSecret: stgJwtSecret,
      image,
      dbName: 'test_db',
      deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
    });
    const stgWebStack = new WebStack(app, 'StgWebStack', {
      env: TEST_ENV,
      vpc: stgNetworkStack.vpc,
      apiUrl: 'http://stg-api.example.com',
      authSecret: new secretsmanager.Secret(stgSharedStack, 'StgAuthSecret'),
      image,
      deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
    });

    const pipelineStack = new PipelineStack(app, 'TestPipelineStack', {
      env: TEST_ENV,
      githubOrg: 'acme',
      githubRepo: 'forge',

      ecrStack,
      dev: { apiStack, webStack },
      stg: { apiStack: stgApiStack, webStack: stgWebStack },
    });
    return Template.fromStack(pipelineStack);
  })();

  it('APIパイプラインにSTG承認・昇格・デプロイステージが追加される', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'ApiAppPipeline',
      Stages: Match.arrayWith([
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'GenerateDev' }),
        Match.objectLike({ Name: 'DeployDev' }),
        Match.objectLike({ Name: 'ApproveStg' }),
        Match.objectLike({ Name: 'PromoteToStg' }),
        Match.objectLike({ Name: 'GenerateStg' }),
        Match.objectLike({ Name: 'DeployStg' }),
      ]),
    });
  });

  it('DEV+STGで4つのデプロイメントグループが作成される（API×2・Web×2）', () => {
    const groups = template.findResources('AWS::CodeDeploy::DeploymentGroup');
    expect(Object.keys(groups).length).toBe(4);
  });

  it('DEV→STG昇格用の CodeBuild プロジェクトが作成される', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'ApiPromoteToStg',
    });
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'WebPromoteToStg',
    });
  });
});
