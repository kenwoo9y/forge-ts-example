import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import type { Construct } from 'constructs';

export interface EcrRepos {
  api: ecr.Repository;
  web: ecr.Repository;
}

export interface EcrStackProps extends cdk.StackProps {
  /** STG 環境の ECR リポジトリを作成するか（デフォルト: false） */
  enableStg?: boolean;
  /** PROD 環境の ECR リポジトリを作成するか（デフォルト: false） */
  enableProd?: boolean;
}

/**
 * ECRリポジトリスタック
 * 環境ごとに api / web のリポジトリペアを管理する
 * DEV は常に作成。STG/PROD は enableStg/enableProd フラグで制御する
 */
export class EcrStack extends cdk.Stack {
  public readonly dev: EcrRepos;
  public readonly stg?: EcrRepos;
  public readonly prod?: EcrRepos;

  constructor(scope: Construct, id: string, props?: EcrStackProps) {
    super(scope, id, props);

    this.dev = this.createRepos('dev');

    if (props?.enableStg) {
      this.stg = this.createRepos('stg');
    }
    if (props?.enableProd) {
      this.prod = this.createRepos('prod');
    }
  }

  private createRepos(env: string): EcrRepos {
    const suffix = env.charAt(0).toUpperCase() + env.slice(1);

    const api = new ecr.Repository(this, `ApiRepository${suffix}`, {
      repositoryName: `forge-ts/api-${env}`,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    api.addLifecycleRule({
      rulePriority: 1,
      description: 'Keep only last 20 images',
      maxImageCount: 20,
      tagStatus: ecr.TagStatus.ANY,
    });

    const web = new ecr.Repository(this, `WebRepository${suffix}`, {
      repositoryName: `forge-ts/web-${env}`,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    web.addLifecycleRule({
      rulePriority: 1,
      description: 'Keep only last 20 images',
      maxImageCount: 20,
      tagStatus: ecr.TagStatus.ANY,
    });

    return { api, web };
  }
}
