import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, it } from 'vitest';
import { NetworkStack } from '../lib/stacks/network-stack';

describe('NetworkStack', () => {
  const app = new cdk.App();
  const stack = new NetworkStack(app, 'TestNetworkStack');
  const template = Template.fromStack(stack);

  it('VPCが作成される', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  it('パブリックサブネットとプライベートサブネットが2AZ分作成される', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
  });

  it('NATゲートウェイが1つ作成される', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  it('インターネットゲートウェイが作成される', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  it('ALB用セキュリティグループが作成される', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ALB',
    });
  });

  it('ECS用セキュリティグループが作成される', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ECS Fargate',
    });
  });

  it('RDS用セキュリティグループが作成される', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for RDS PostgreSQL',
    });
  });

  it('ALBセキュリティグループがHTTP(80)を許可する', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ALB',
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp',
        }),
      ]),
    });
  });

  it('ALBセキュリティグループがHTTPS(443)を許可する', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ALB',
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp',
        }),
      ]),
    });
  });

  it('ECSセキュリティグループがALBからのポート3000を許可する', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 3000,
      ToPort: 3000,
      IpProtocol: 'tcp',
    });
  });

  it('RDSセキュリティグループがECSからのPostgreSQL(5432)を許可する', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 5432,
      ToPort: 5432,
      IpProtocol: 'tcp',
    });
  });
});
