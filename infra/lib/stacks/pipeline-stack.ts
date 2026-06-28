import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';
import type * as ecr from 'aws-cdk-lib/aws-ecr';
import type * as ecs from 'aws-cdk-lib/aws-ecs';
import type * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import type { ApiStack } from './api-stack';
import type { EcrStack } from './ecr-stack';
import type { WebStack } from './web-stack';

export interface EnvResources {
  apiStack: ApiStack;
  webStack: WebStack;
}

export interface PipelineStackProps extends cdk.StackProps {
  githubOrg: string;
  githubRepo: string;
  ecrStack: EcrStack;
  dev: EnvResources;
  stg?: EnvResources;
  prod?: EnvResources;
}

interface AppEnvConfig {
  repository: ecr.Repository;
  fargateService: ecs.FargateService;
  clusterName: string;
  blueTargetGroup: elbv2.ApplicationTargetGroup;
  greenTargetGroup: elbv2.ApplicationTargetGroup;
  productionListener: elbv2.ApplicationListener;
  testListener?: elbv2.ApplicationListener;
  containerPort: string;
}

/**
 * CI/CDパイプラインスタック
 * - GitHub Actions OIDC ロール（ECR push・cdk deploy・cdk diff 用）
 * - アプリパイプライン（DEV→STG→PROD の昇格モデル）
 */
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { githubOrg, githubRepo, ecrStack, dev, stg, prod } = props;

    // ─── GitHub OIDC プロバイダー ────────────────────────────────────────────
    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    });

    // ─── OIDC ロール: アプリデプロイ用（DEV ECR push のみ） ─────────────────
    const appDeployOidcRole = new iam.Role(this, 'AppDeployOidcRole', {
      roleName: 'github-actions-app-deploy',
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:ref:refs/heads/main`,
        },
      }),
      description: 'GitHub Actions: DEV ECR push only (app deploy)',
    });

    // GitHub Actions は DEV リポジトリにのみ push する
    ecrStack.dev.api.grantPush(appDeployOidcRole);
    ecrStack.dev.web.grantPush(appDeployOidcRole);

    appDeployOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrAuth',
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      })
    );
    appDeployOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'EcrScan',
        actions: ['ecr:DescribeImageScanFindings', 'ecr:DescribeImages'],
        resources: [ecrStack.dev.api.repositoryArn, ecrStack.dev.web.repositoryArn],
      })
    );

    // ─── OIDC ロール: インフラ diff 用（読み取りのみ） ───────────────────────
    const infraDiffOidcRole = new iam.Role(this, 'InfraDiffOidcRole', {
      roleName: 'github-actions-infra-diff',
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:*`,
        },
      }),
      description: 'GitHub Actions: cdk synth/diff read-only (infra diff)',
    });

    infraDiffOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CfnRead',
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:GetTemplate',
          'cloudformation:DescribeStackResources',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ListChangeSets',
          'cloudformation:ListStackResources',
          'cloudformation:GetTemplateSummary',
        ],
        resources: ['*'],
      })
    );
    infraDiffOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DescribeInfra',
        actions: [
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeRouteTables',
          'ec2:DescribeAvailabilityZones',
          'ec2:DescribeSecurityGroups',
          'ssm:GetParameter',
          'ssm:GetParameters',
        ],
        resources: ['*'],
      })
    );
    infraDiffOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkLookup',
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*-lookup-role-*`],
      })
    );

    // ─── OIDC ロール: インフラデプロイ用（cdk deploy、production Environment にスコープ） ──
    const infraDeployOidcRole = new iam.Role(this, 'InfraDeployOidcRole', {
      roleName: 'github-actions-infra-deploy',
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:environment:production`,
        },
      }),
      description: 'GitHub Actions: cdk deploy via infra-deploy.yaml (production environment only)',
    });

    infraDeployOidcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkDeploy',
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    // ─── アプリパイプライン（API・Web） ───────────────────────────────────────
    const devApiGreenTg = dev.apiStack.ecsFargateService.greenTargetGroup;
    const devWebGreenTg = dev.webStack.ecsFargateService.greenTargetGroup;
    if (!devApiGreenTg || !devWebGreenTg) {
      throw new Error('DEV ApiStack/WebStack must use CODE_DEPLOY deployment controller');
    }

    const devApiConfig: AppEnvConfig = {
      repository: ecrStack.dev.api,
      fargateService: dev.apiStack.ecsFargateService.fargateService,
      clusterName: dev.apiStack.ecsFargateService.cluster.clusterName,
      blueTargetGroup: dev.apiStack.ecsFargateService.blueTargetGroup,
      greenTargetGroup: devApiGreenTg,
      productionListener: dev.apiStack.ecsFargateService.productionListener,
      testListener: dev.apiStack.ecsFargateService.testListener,
      containerPort: '3000',
    };
    const devWebConfig: AppEnvConfig = {
      repository: ecrStack.dev.web,
      fargateService: dev.webStack.ecsFargateService.fargateService,
      clusterName: dev.webStack.ecsFargateService.cluster.clusterName,
      blueTargetGroup: dev.webStack.ecsFargateService.blueTargetGroup,
      greenTargetGroup: devWebGreenTg,
      productionListener: dev.webStack.ecsFargateService.productionListener,
      testListener: dev.webStack.ecsFargateService.testListener,
      containerPort: '3001',
    };

    const stgApiConfig =
      stg && ecrStack.stg ? this.buildEnvConfig(stg.apiStack, ecrStack.stg.api, '3000') : undefined;
    const stgWebConfig =
      stg && ecrStack.stg ? this.buildEnvConfig(stg.webStack, ecrStack.stg.web, '3001') : undefined;
    const prodApiConfig =
      prod && ecrStack.prod
        ? this.buildEnvConfig(prod.apiStack, ecrStack.prod.api, '3000')
        : undefined;
    const prodWebConfig =
      prod && ecrStack.prod
        ? this.buildEnvConfig(prod.webStack, ecrStack.prod.web, '3001')
        : undefined;

    this.createAppPipeline('Api', devApiConfig, stgApiConfig, prodApiConfig);
    this.createAppPipeline('Web', devWebConfig, stgWebConfig, prodWebConfig);
  }

  private buildEnvConfig(
    appStack: ApiStack | WebStack,
    repository: ecr.Repository,
    containerPort: string
  ): AppEnvConfig {
    const svc = appStack.ecsFargateService;
    if (!svc.greenTargetGroup) {
      throw new Error('AppStack must use CODE_DEPLOY deployment controller');
    }
    return {
      repository,
      fargateService: svc.fargateService,
      clusterName: svc.cluster.clusterName,
      blueTargetGroup: svc.blueTargetGroup,
      greenTargetGroup: svc.greenTargetGroup,
      productionListener: svc.productionListener,
      testListener: svc.testListener,
      containerPort,
    };
  }

  // ─── アプリパイプライン（昇格モデル） ─────────────────────────────────────

  private createAppPipeline(
    appName: string,
    devConfig: AppEnvConfig,
    stgConfig?: AppEnvConfig,
    prodConfig?: AppEnvConfig
  ): void {
    const pipeline = new codepipeline.Pipeline(this, `${appName}AppPipeline`, {
      pipelineName: `${appName}AppPipeline`,
      restartExecutionOnUpdate: false,
    });

    // Source: DEV ECR の :latest をトリガーに起動
    const devSource = new codepipeline.Artifact(`${appName}DevSource`);
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpactions.EcrSourceAction({
          actionName: 'ECR',
          repository: devConfig.repository,
          imageTag: 'latest',
          output: devSource,
        }),
      ],
    });

    // DEV: デプロイメントアーティファクト生成 → Blue/Green デプロイ
    const devGen = new codepipeline.Artifact(`${appName}DevGen`);
    pipeline.addStage({
      stageName: 'GenerateDev',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'GenerateDeployArtifacts',
          project: this.buildGenerateProject(`${appName}GenDev`, devConfig),
          input: devSource,
          outputs: [devGen],
        }),
      ],
    });
    pipeline.addStage({
      stageName: 'DeployDev',
      actions: [
        new cpactions.CodeDeployEcsDeployAction({
          actionName: 'CodeDeployBlueGreen',
          deploymentGroup: this.buildDeploymentGroup(`${appName}Dev`, devConfig),
          appSpecTemplateInput: devGen,
          taskDefinitionTemplateInput: devGen,
        }),
      ],
    });

    // STG への昇格（enableStg 時のみ）
    if (stgConfig) {
      const stgSource = new codepipeline.Artifact(`${appName}StgSource`);

      pipeline.addStage({
        stageName: 'ApproveStg',
        actions: [new cpactions.ManualApprovalAction({ actionName: 'ApproveStg' })],
      });
      pipeline.addStage({
        stageName: 'PromoteToStg',
        actions: [
          new cpactions.CodeBuildAction({
            actionName: 'PromoteImage',
            project: this.buildPromoteProject(
              `${appName}PromoteToStg`,
              devConfig.repository,
              stgConfig.repository
            ),
            input: devSource,
            outputs: [stgSource],
          }),
        ],
      });

      const stgGen = new codepipeline.Artifact(`${appName}StgGen`);
      pipeline.addStage({
        stageName: 'GenerateStg',
        actions: [
          new cpactions.CodeBuildAction({
            actionName: 'GenerateDeployArtifacts',
            project: this.buildGenerateProject(`${appName}GenStg`, stgConfig),
            input: stgSource,
            outputs: [stgGen],
          }),
        ],
      });
      pipeline.addStage({
        stageName: 'DeployStg',
        actions: [
          new cpactions.CodeDeployEcsDeployAction({
            actionName: 'CodeDeployBlueGreen',
            deploymentGroup: this.buildDeploymentGroup(`${appName}Stg`, stgConfig),
            appSpecTemplateInput: stgGen,
            taskDefinitionTemplateInput: stgGen,
          }),
        ],
      });

      // PROD への昇格（enableProd 時のみ）
      if (prodConfig) {
        const prodSource = new codepipeline.Artifact(`${appName}ProdSource`);

        pipeline.addStage({
          stageName: 'ApproveProd',
          actions: [new cpactions.ManualApprovalAction({ actionName: 'ApproveProd' })],
        });
        pipeline.addStage({
          stageName: 'PromoteToProd',
          actions: [
            new cpactions.CodeBuildAction({
              actionName: 'PromoteImage',
              project: this.buildPromoteProject(
                `${appName}PromoteToProd`,
                stgConfig.repository,
                prodConfig.repository
              ),
              input: stgSource,
              outputs: [prodSource],
            }),
          ],
        });

        const prodGen = new codepipeline.Artifact(`${appName}ProdGen`);
        pipeline.addStage({
          stageName: 'GenerateProd',
          actions: [
            new cpactions.CodeBuildAction({
              actionName: 'GenerateDeployArtifacts',
              project: this.buildGenerateProject(`${appName}GenProd`, prodConfig),
              input: prodSource,
              outputs: [prodGen],
            }),
          ],
        });
        pipeline.addStage({
          stageName: 'DeployProd',
          actions: [
            new cpactions.CodeDeployEcsDeployAction({
              actionName: 'CodeDeployBlueGreen',
              deploymentGroup: this.buildDeploymentGroup(`${appName}Prod`, prodConfig),
              appSpecTemplateInput: prodGen,
              taskDefinitionTemplateInput: prodGen,
            }),
          ],
        });
      }
    }
  }

  // ─── ヘルパー: デプロイアーティファクト生成 CodeBuild ───────────────────────

  private buildGenerateProject(id: string, config: AppEnvConfig): codebuild.PipelineProject {
    const project = new codebuild.PipelineProject(this, `${id}Project`, {
      projectName: id,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          ECS_CLUSTER_NAME: { value: config.clusterName },
          ECS_SERVICE_NAME: { value: config.fargateService.serviceName },
          CONTAINER_PORT: { value: config.containerPort },
          CONTAINER_NAME: { value: 'Container' },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              "IMAGE_URI=$(python3 -c \"import json; print(json.load(open('imageDetail.json'))['ImageURI'])\")",
              'TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query \'services[0].taskDefinition\' --output text)',
              'aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query taskDefinition --output json | jq \'del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.placementConstraints,.compatibilities,.registeredAt,.registeredBy,.deregisteredAt)\' > taskdef.json',
              'jq --arg img "$IMAGE_URI" --arg name "$CONTAINER_NAME" \'(.containerDefinitions[] | select(.name == $name)) |= (. + {image: $img} | del(.command))\' taskdef.json > taskdef_tmp.json && mv taskdef_tmp.json taskdef.json',
              'printf \'version: 0.0\\nResources:\\n  - TargetService:\\n      Type: AWS::ECS::Service\\n      Properties:\\n        TaskDefinition: <TASK_DEFINITION>\\n        LoadBalancerInfo:\\n          ContainerName: "%s"\\n          ContainerPort: %s\\n\' "$CONTAINER_NAME" "$CONTAINER_PORT" > appspec.yaml',
            ],
          },
        },
        artifacts: { files: ['taskdef.json', 'appspec.yaml'] },
      }),
    });
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecs:DescribeServices', 'ecs:DescribeTaskDefinition'],
        resources: ['*'],
      })
    );
    return project;
  }

  // ─── ヘルパー: 環境間イメージ昇格 CodeBuild ────────────────────────────────

  private buildPromoteProject(
    id: string,
    srcRepo: ecr.Repository,
    dstRepo: ecr.Repository
  ): codebuild.PipelineProject {
    const project = new codebuild.PipelineProject(this, `${id}Project`, {
      projectName: id,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          SRC_REPO: { value: srcRepo.repositoryName },
          DST_REPO: { value: dstRepo.repositoryName },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              // 移行元イメージのダイジェストを取得
              "IMAGE_URI=$(python3 -c \"import json; print(json.load(open('imageDetail.json'))['ImageURI'])\")",
              "IMAGE_DIGEST=$(echo \"$IMAGE_URI\" | awk -F'@' '{print $2}')",
              // マニフェストを移行先リポジトリに書き込む（同一ダイジェストで :latest タグ）
              'MANIFEST=$(aws ecr batch-get-image --repository-name "$SRC_REPO" --image-ids imageDigest="$IMAGE_DIGEST" --query \'images[0].imageManifest\' --output text)',
              'aws ecr put-image --repository-name "$DST_REPO" --image-tag latest --image-manifest "$MANIFEST"',
              // 後続ステージ用に移行先の imageDetail.json を出力
              'REGISTRY=$(echo "$IMAGE_URI" | cut -d\'/\' -f1)',
              'echo "{\\"ImageURI\\":\\"$REGISTRY/$DST_REPO@$IMAGE_DIGEST\\"}" > imageDetail.json',
            ],
          },
        },
        artifacts: { files: ['imageDetail.json'] },
      }),
    });
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      })
    );
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecr:BatchGetImage', 'ecr:GetDownloadUrlForLayer'],
        resources: [srcRepo.repositoryArn],
      })
    );
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:BatchCheckLayerAvailability',
        ],
        resources: [dstRepo.repositoryArn],
      })
    );
    return project;
  }

  // ─── ヘルパー: CodeDeploy デプロイメントグループ ────────────────────────────

  private buildDeploymentGroup(id: string, config: AppEnvConfig): codedeploy.EcsDeploymentGroup {
    const blueGreenConfig: codedeploy.EcsBlueGreenDeploymentConfig = {
      blueTargetGroup: config.blueTargetGroup,
      greenTargetGroup: config.greenTargetGroup,
      listener: config.productionListener,
      terminationWaitTime: cdk.Duration.minutes(0),
      ...(config.testListener ? { testListener: config.testListener } : {}),
    };
    return new codedeploy.EcsDeploymentGroup(this, `${id}DeploymentGroup`, {
      service: config.fargateService,
      blueGreenDeploymentConfig: blueGreenConfig,
      deploymentConfig: codedeploy.EcsDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTES,
      autoRollback: { failedDeployment: true, stoppedDeployment: false },
    });
  }
}
