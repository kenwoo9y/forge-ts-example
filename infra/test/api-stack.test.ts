import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { describe, it } from 'vitest';
import { ApiStack } from '../lib/stacks/api-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { NetworkStack } from '../lib/stacks/network-stack';

describe('ApiStack', () => {
  const app = new cdk.App();
  const networkStack = new NetworkStack(app, 'TestNetworkStack');
  const databaseStack = new DatabaseStack(app, 'TestDatabaseStack', {
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
  });
  // JWTシークレットはテスト用スタックで作成
  const sharedStack = new cdk.Stack(app, 'TestSharedStack');
  const jwtSecret = new secretsmanager.Secret(sharedStack, 'JwtSecret');

  const stack = new ApiStack(app, 'TestApiStack', {
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
    database: databaseStack.database,
    databaseCredentials: databaseStack.credentials,
    jwtSecret,
    image: ecs.ContainerImage.fromRegistry('nginx'),
  });
  const template = Template.fromStack(stack);

  it('ECSクラスターが作成される', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
  });

  it('Fargateサービスが作成される', () => {
    template.resourceCountIs('AWS::ECS::Service', 1);
  });

  it('タスク定義が作成される', () => {
    template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
  });

  it('ALBが作成される', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  });

  it('コンテナがポート3000を使用する', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          PortMappings: Match.arrayWith([Match.objectLike({ ContainerPort: 3000 })]),
        }),
      ]),
    });
  });

  it('タスクがプライベートサブネットに配置される', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      NetworkConfiguration: Match.objectLike({
        AwsvpcConfiguration: Match.objectLike({
          AssignPublicIp: 'DISABLED',
        }),
      }),
    });
  });

  it('DB_HOSTが環境変数に設定される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([Match.objectLike({ Name: 'DB_HOST' })]),
        }),
      ]),
    });
  });

  it('DB_NAMEがtask_dbに設定される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([Match.objectLike({ Name: 'DB_NAME', Value: 'task_db' })]),
        }),
      ]),
    });
  });

  it('DB_PASSWORDがSecretsManagerから注入される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.arrayWith([Match.objectLike({ Name: 'DB_PASSWORD' })]),
        }),
      ]),
    });
  });

  it('JWT_SECRETがSecretsManagerから注入される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Secrets: Match.arrayWith([Match.objectLike({ Name: 'JWT_SECRET' })]),
        }),
      ]),
    });
  });

  it('NODE_ENV=productionが設定される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'NODE_ENV', Value: 'production' }),
          ]),
        }),
      ]),
    });
  });
});
