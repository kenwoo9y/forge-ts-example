import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { describe, it } from 'vitest';
import { NetworkStack } from '../lib/stacks/network-stack';
import { WebStack } from '../lib/stacks/web-stack';

describe('WebStack', () => {
  const app = new cdk.App();
  const networkStack = new NetworkStack(app, 'TestNetworkStack');
  const stack = new WebStack(app, 'TestWebStack', {
    vpc: networkStack.vpc,
    apiUrl: 'http://api.example.com',
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

  it('コンテナがポート3001を使用する', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          PortMappings: Match.arrayWith([Match.objectLike({ ContainerPort: 3001 })]),
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

  it('API_URLが環境変数に設定される', () => {
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Environment: Match.arrayWith([
            Match.objectLike({ Name: 'API_URL', Value: 'http://api.example.com' }),
          ]),
        }),
      ]),
    });
  });
});
