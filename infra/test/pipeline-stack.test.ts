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
  });
  const sharedStack = new cdk.Stack(app, 'TestSharedStack', { env: TEST_ENV });
  const jwtSecret = new secretsmanager.Secret(sharedStack, 'JwtSecret');

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
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  const webStack = new WebStack(app, 'TestWebStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    apiUrl: 'http://api.example.com',
    image,
    deploymentController: ecs.DeploymentControllerType.CODE_DEPLOY,
  });

  const pipelineStack = new PipelineStack(app, 'TestPipelineStack', {
    env: TEST_ENV,
    githubOrg: 'acme',
    githubRepo: 'forge',
    codestarConnectionArn:
      'arn:aws:codestar-connections:ap-northeast-1:123456789012:connection/test-connection',
    apiStack,
    webStack,
    apiRepository: ecrStack.apiRepository,
    webRepository: ecrStack.webRepository,
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

  // ─── CodePipeline ────────────────────────────────────────────────────────────

  describe('パイプライン', () => {
    it('パイプラインが3つ作成される（インフラ・API・Web）', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 3);
    });

    it('インフラパイプラインが正しい名前で作成される', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'InfraCdkPipeline',
      });
    });

    it('インフラパイプラインが4ステージで構成される（Source→Synth→Approve→Deploy）', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'InfraCdkPipeline',
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Synth' }),
          Match.objectLike({ Name: 'Approve' }),
          Match.objectLike({ Name: 'Deploy' }),
        ]),
      });
    });

    it('インフラパイプラインに手動承認ステージが含まれる', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'InfraCdkPipeline',
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Approve',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: Match.objectLike({
                  Category: 'Approval',
                  Provider: 'Manual',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    it('アプリパイプラインが3ステージで構成される（Source→Generate→Deploy）', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ApiAppPipeline',
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Generate' }),
          Match.objectLike({ Name: 'Deploy' }),
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
    it('CDK Synth プロジェクトが作成される', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'InfraCdkSynth',
      });
    });

    it('CDK Deploy プロジェクトが作成される', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'InfraCdkDeploy',
      });
    });

    it('CDK Deploy ロールが CDK bootstrap ロールへの AssumeRole 権限を持つ', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'CdkBootstrapRoles',
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
