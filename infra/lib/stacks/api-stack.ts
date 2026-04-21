import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import type * as rds from 'aws-cdk-lib/aws-rds';
import type * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import { EcsFargateService } from '../constructs/ecs-fargate-service';

export interface ApiStackProps extends cdk.StackProps {
  /** NetworkStackで定義したVPC */
  vpc: ec2.Vpc;
  /** NetworkStackで定義したRDS用セキュリティグループ（ECS→RDSの接続許可に使用） */
  rdsSecurityGroup: ec2.SecurityGroup;
  /** DatabaseStackで作成したRDSインスタンス */
  database: rds.DatabaseInstance;
  /** DatabaseStackで作成したDB認証情報（Secrets Manager） */
  databaseCredentials: rds.DatabaseSecret;
  /** Secrets ManagerにあるJWT署名シークレット */
  jwtSecret: secretsmanager.ISecret;
  /** コンテナイメージ（デフォルト: apps/apiのDockerfileからビルド） */
  image?: ecs.ContainerImage;
  /** タスクのCPUユニット数（デフォルト: 256） */
  cpu?: number;
  /** タスクのメモリ (MiB)（デフォルト: 512） */
  memoryLimitMiB?: number;
  /** 起動タスク数（デフォルト: 1） */
  desiredCount?: number;
}

/**
 * APIバックエンド層のスタック
 * HonoアプリをECS Fargateでホストし、RDS PostgreSQLに接続する
 */
export class ApiStack extends cdk.Stack {
  /** ECS Fargateサービスのコンストラクト */
  public readonly ecsFargateService: EcsFargateService;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      vpc,
      rdsSecurityGroup,
      database,
      databaseCredentials,
      jwtSecret,
      image = ecs.ContainerImage.fromAsset('../apps/api'),
      cpu = 256,
      memoryLimitMiB = 512,
      desiredCount = 1,
    } = props;

    this.ecsFargateService = new EcsFargateService(this, 'ApiService', {
      vpc,
      image,
      containerPort: 3000,
      environment: {
        DB_HOST: database.dbInstanceEndpointAddress,
        DB_PORT: database.dbInstanceEndpointPort,
        DB_NAME: 'task_db',
        NODE_ENV: 'production',
      },
      secrets: {
        // DB_USERNAME / DB_PASSWORD は起動時にSecrets Managerから注入される
        // アプリ側でこれらを使いDATABASE_URLを構築する
        DB_USERNAME: ecs.Secret.fromSecretsManager(databaseCredentials, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(databaseCredentials, 'password'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
      },
      cpu,
      memoryLimitMiB,
      desiredCount,
    });

    // ECSサービスのSG → RDSのSG へのポート5432インバウンドルールを追加
    // CfnSecurityGroupIngressを直接作成することでスタック間の循環依存を回避する
    // （rdsSecurityGroup.securityGroupIdを文字列参照として取得し、ApiStack内のリソースとして定義）
    new ec2.CfnSecurityGroupIngress(this, 'EcsToRdsIngress', {
      groupId: rdsSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      sourceSecurityGroupId:
        this.ecsFargateService.service.service.connections.securityGroups[0].securityGroupId,
    });

    // ECSタスクにDB認証情報・JWTシークレットの読み取り権限を付与
    databaseCredentials.grantRead(this.ecsFargateService.service.taskDefinition.taskRole);
    jwtSecret.grantRead(this.ecsFargateService.service.taskDefinition.taskRole);
  }
}
