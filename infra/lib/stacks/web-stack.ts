import * as cdk from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type { Construct } from 'constructs';
import { EcsFargateService } from '../constructs/ecs-fargate-service';

export interface WebStackProps extends cdk.StackProps {
  /** NetworkStackで定義したVPC */
  vpc: ec2.Vpc;
  /** バックエンドAPIのURL */
  apiUrl: string;
  /** コンテナイメージ（デフォルト: apps/webのDockerfileからビルド） */
  image?: ecs.ContainerImage;
  /** タスクのCPUユニット数（デフォルト: 256） */
  cpu?: number;
  /** タスクのメモリ (MiB)（デフォルト: 512） */
  memoryLimitMiB?: number;
  /** 起動タスク数（デフォルト: 1） */
  desiredCount?: number;
}

/**
 * Webフロントエンド層のスタック
 * Next.jsアプリをECS Fargateでホストする
 */
export class WebStack extends cdk.Stack {
  /** ECS Fargateサービスのコンストラクト */
  public readonly ecsFargateService: EcsFargateService;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const {
      vpc,
      apiUrl,
      image = ecs.ContainerImage.fromAsset('../apps/web'),
      cpu = 256,
      memoryLimitMiB = 512,
      desiredCount = 1,
    } = props;

    this.ecsFargateService = new EcsFargateService(this, 'WebService', {
      vpc,
      image,
      containerPort: 3001,
      environment: {
        API_URL: apiUrl,
        NODE_ENV: 'production',
      },
      cpu,
      memoryLimitMiB,
      desiredCount,
    });
  }
}
