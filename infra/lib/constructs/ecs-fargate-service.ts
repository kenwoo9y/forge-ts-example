import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

export interface EcsFargateServiceProps {
  /** NetworkStackで定義したVPC */
  vpc: ec2.Vpc;
  /** コンテナイメージ */
  image: ecs.ContainerImage;
  /** コンテナが待ち受けるポート番号 */
  containerPort: number;
  /** 環境変数 */
  environment?: Record<string, string>;
  /** Secrets Managerなどのシークレット */
  secrets?: Record<string, ecs.Secret>;
  /** タスクのCPUユニット数（デフォルト: 256） */
  cpu?: number;
  /** タスクのメモリ (MiB)（デフォルト: 512） */
  memoryLimitMiB?: number;
  /** 起動タスク数（デフォルト: 1） */
  desiredCount?: number;
}

/**
 * ALB + ECS Fargateサービスの再利用可能なコンストラクト
 * APIサーバー・Webアプリなど複数のサービスで共通利用する
 */
export class EcsFargateService extends Construct {
  /** ECSクラスター */
  public readonly cluster: ecs.Cluster;
  /** ALB + Fargateサービス */
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: EcsFargateServiceProps) {
    super(scope, id);

    const {
      vpc,
      image,
      containerPort,
      environment,
      secrets,
      cpu = 256,
      memoryLimitMiB = 512,
      desiredCount = 1,
    } = props;

    this.cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster: this.cluster,
      taskImageOptions: {
        image,
        containerPort,
        environment,
        secrets,
      },
      cpu,
      memoryLimitMiB,
      desiredCount,
      publicLoadBalancer: true,
      assignPublicIp: false,
      taskSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // ヘルスチェックの猶予期間
    this.service.targetGroup.configureHealthCheck({
      path: '/',
      healthyHttpCodes: '200-399',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });
  }
}
