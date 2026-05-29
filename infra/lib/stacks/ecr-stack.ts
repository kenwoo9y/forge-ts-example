import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import type { Construct } from 'constructs';

/**
 * ECRリポジトリスタック
 * フロントエンド・バックエンドのDockerイメージを管理する
 */
export class EcrStack extends cdk.Stack {
  /** バックエンドAPIのECRリポジトリ */
  public readonly apiRepository: ecr.Repository;
  /** フロントエンドWebのECRリポジトリ */
  public readonly webRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: 'forge-ts/api',
      // MUTABLE: :latest タグを更新してCodePipelineトリガーに使用するため
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.apiRepository.addLifecycleRule({
      rulePriority: 1,
      description: 'Keep only last 20 images',
      maxImageCount: 20,
      tagStatus: ecr.TagStatus.ANY,
    });

    this.webRepository = new ecr.Repository(this, 'WebRepository', {
      repositoryName: 'forge-ts/web',
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.webRepository.addLifecycleRule({
      rulePriority: 1,
      description: 'Keep only last 20 images',
      maxImageCount: 20,
      tagStatus: ecr.TagStatus.ANY,
    });
  }
}
