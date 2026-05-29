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
import type { WebStack } from './web-stack';

export interface PipelineStackProps extends cdk.StackProps {
  /** GitHubの組織名またはユーザー名 */
  githubOrg: string;
  /** GitHubのリポジトリ名 */
  githubRepo: string;
  /** CodeStar Connections の接続ARN */
  codestarConnectionArn: string;
  /** バックエンドAPIスタック */
  apiStack: ApiStack;
  /** フロントエンドWebスタック */
  webStack: WebStack;
  /** APIのECRリポジトリ */
  apiRepository: ecr.Repository;
  /** WebのECRリポジトリ */
  webRepository: ecr.Repository;
}

/**
 * CI/CDパイプラインスタック
 * - GitHub Actions OIDC ロール（ECR push・cdk diff 用）
 * - インフラパイプライン（CodePipeline + CodeBuild: cdk deploy）
 * - アプリパイプライン（CodePipeline + CodeDeploy: ECS Blue/Green）
 */
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const {
      githubOrg,
      githubRepo,
      codestarConnectionArn,
      apiStack,
      webStack,
      apiRepository,
      webRepository,
    } = props;

    // ─── GitHub OIDC プロバイダー ────────────────────────────────────────────
    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    });

    // ─── OIDC ロール: アプリデプロイ用（ECR push のみ） ─────────────────────
    const appDeployOidcRole = new iam.Role(this, 'AppDeployOidcRole', {
      roleName: 'github-actions-app-deploy',
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:ref:refs/heads/main`,
        },
      }),
      description: 'GitHub Actions: ECR push only (app deploy)',
    });

    apiRepository.grantPush(appDeployOidcRole);
    webRepository.grantPush(appDeployOidcRole);

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
        resources: [apiRepository.repositoryArn, webRepository.repositoryArn],
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

    // ─── インフラパイプライン ─────────────────────────────────────────────────
    this.createInfraPipeline(githubOrg, githubRepo, codestarConnectionArn);

    // ─── アプリパイプライン（API・Web） ───────────────────────────────────────
    const apiGreenTg = apiStack.ecsFargateService.greenTargetGroup;
    const webGreenTg = webStack.ecsFargateService.greenTargetGroup;

    if (!apiGreenTg || !webGreenTg) {
      throw new Error(
        'ApiStack and WebStack must use CODE_DEPLOY deployment controller for PipelineStack'
      );
    }

    this.createAppPipeline('Api', {
      repository: apiRepository,
      fargateService: apiStack.ecsFargateService.fargateService,
      clusterName: apiStack.ecsFargateService.cluster.clusterName,
      blueTargetGroup: apiStack.ecsFargateService.blueTargetGroup,
      greenTargetGroup: apiGreenTg,
      productionListener: apiStack.ecsFargateService.productionListener,
      testListener: apiStack.ecsFargateService.testListener,
      containerPort: '3000',
    });

    this.createAppPipeline('Web', {
      repository: webRepository,
      fargateService: webStack.ecsFargateService.fargateService,
      clusterName: webStack.ecsFargateService.cluster.clusterName,
      blueTargetGroup: webStack.ecsFargateService.blueTargetGroup,
      greenTargetGroup: webGreenTg,
      productionListener: webStack.ecsFargateService.productionListener,
      testListener: webStack.ecsFargateService.testListener,
      containerPort: '3001',
    });
  }

  private createInfraPipeline(
    githubOrg: string,
    githubRepo: string,
    codestarConnectionArn: string
  ): void {
    const sourceOutput = new codepipeline.Artifact('InfraSource');
    const synthOutput = new codepipeline.Artifact('InfraSynthOutput');

    // Synth プロジェクト
    const synthProject = new codebuild.PipelineProject(this, 'InfraSynthProject', {
      projectName: 'InfraCdkSynth',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: '22' },
            commands: ['npm install -g pnpm@11.4.0', 'pnpm install --frozen-lockfile'],
          },
          build: {
            commands: ['cd infra && npx cdk synth'],
          },
        },
        artifacts: {
          'base-directory': 'infra/cdk.out',
          files: ['**/*'],
        },
      }),
    });

    synthProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*-lookup-role-*`],
      })
    );
    synthProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudformation:DescribeStacks',
          'ec2:DescribeAvailabilityZones',
          'ssm:GetParameter',
        ],
        resources: ['*'],
      })
    );

    // Deploy プロジェクト（CDK bootstrap ロールを引き受けて実行）
    const deployRole = new iam.Role(this, 'CodeBuildDeployRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'CodeBuild role for CDK deploy (assumes CDK bootstrap roles)',
    });
    deployRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CdkBootstrapRoles',
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      })
    );

    const deployProject = new codebuild.PipelineProject(this, 'InfraDeployProject', {
      projectName: 'InfraCdkDeploy',
      role: deployRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: '22' },
            commands: ['npm install -g pnpm@11.4.0', 'pnpm install --frozen-lockfile'],
          },
          build: {
            commands: ['cd infra && npx cdk deploy --require-approval never --all'],
          },
        },
      }),
    });

    const pipeline = new codepipeline.Pipeline(this, 'InfraPipeline', {
      pipelineName: 'InfraCdkPipeline',
      restartExecutionOnUpdate: false,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpactions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub',
          owner: githubOrg,
          repo: githubRepo,
          branch: 'main',
          connectionArn: codestarConnectionArn,
          output: sourceOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Synth',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'CdkSynth',
          project: synthProject,
          input: sourceOutput,
          outputs: [synthOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Approve',
      actions: [
        new cpactions.ManualApprovalAction({
          actionName: 'ManualApproval',
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'CdkDeploy',
          project: deployProject,
          input: sourceOutput,
        }),
      ],
    });
  }

  private createAppPipeline(
    name: string,
    config: {
      repository: ecr.Repository;
      fargateService: ecs.FargateService;
      clusterName: string;
      blueTargetGroup: elbv2.ApplicationTargetGroup;
      greenTargetGroup: elbv2.ApplicationTargetGroup;
      productionListener: elbv2.ApplicationListener;
      testListener?: elbv2.ApplicationListener;
      containerPort: string;
    }
  ): void {
    const {
      repository,
      fargateService,
      clusterName,
      blueTargetGroup,
      greenTargetGroup,
      productionListener,
      testListener,
      containerPort,
    } = config;

    const sourceOutput = new codepipeline.Artifact(`${name}Source`);
    const genOutput = new codepipeline.Artifact(`${name}GenOutput`);

    // CodeBuild: imageDetail.json から appspec.yaml と taskdef.json を生成
    const genProject = new codebuild.PipelineProject(this, `${name}GenProject`, {
      projectName: `${name}GenerateDeployArtifacts`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          ECS_CLUSTER_NAME: { value: clusterName },
          ECS_SERVICE_NAME: { value: fargateService.serviceName },
          CONTAINER_PORT: { value: containerPort },
          CONTAINER_NAME: { value: 'Container' },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              // ECR source artifact から ImageURI を取得
              "IMAGE_URI=$(python3 -c \"import json; print(json.load(open('imageDetail.json'))['ImageURI'])\")",
              // 現在のタスク定義 ARN を取得
              'TASK_DEF_ARN=$(aws ecs describe-services --cluster "$ECS_CLUSTER_NAME" --services "$ECS_SERVICE_NAME" --query \'services[0].taskDefinition\' --output text)',
              // タスク定義を取得して登録不可フィールドを除去
              'aws ecs describe-task-definition --task-definition "$TASK_DEF_ARN" --query taskDefinition --output json | jq \'del(.taskDefinitionArn,.revision,.status,.requiresAttributes,.placementConstraints,.compatibilities,.registeredAt,.registeredBy,.deregisteredAt)\' > taskdef.json',
              // 対象コンテナのイメージ URI を更新
              'jq --arg img "$IMAGE_URI" --arg name "$CONTAINER_NAME" \'(.containerDefinitions[] | select(.name == $name)).image = $img\' taskdef.json > taskdef_tmp.json && mv taskdef_tmp.json taskdef.json',
              // appspec.yaml を生成
              'printf \'version: 0.0\\nResources:\\n  - TargetService:\\n      Type: AWS::ECS::Service\\n      Properties:\\n        TaskDefinition: <TASK_DEFINITION>\\n        LoadBalancerInfo:\\n          ContainerName: "%s"\\n          ContainerPort: %s\\n\' "$CONTAINER_NAME" "$CONTAINER_PORT" > appspec.yaml',
            ],
          },
        },
        artifacts: {
          files: ['taskdef.json', 'appspec.yaml'],
        },
      }),
    });

    genProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecs:DescribeServices', 'ecs:DescribeTaskDefinition'],
        resources: ['*'],
      })
    );

    // CodeDeploy: Blue/Green デプロイメントグループ
    const blueGreenConfig: codedeploy.EcsBlueGreenDeploymentConfig = {
      blueTargetGroup,
      greenTargetGroup,
      listener: productionListener,
      terminationWaitTime: cdk.Duration.minutes(0),
      ...(testListener ? { testListener } : {}),
    };

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, `${name}DeploymentGroup`, {
      service: fargateService,
      blueGreenDeploymentConfig: blueGreenConfig,
      deploymentConfig: codedeploy.EcsDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTES,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: false,
      },
    });

    const pipeline = new codepipeline.Pipeline(this, `${name}AppPipeline`, {
      pipelineName: `${name}AppPipeline`,
      restartExecutionOnUpdate: false,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpactions.EcrSourceAction({
          actionName: 'ECR',
          repository,
          imageTag: 'latest',
          output: sourceOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Generate',
      actions: [
        new cpactions.CodeBuildAction({
          actionName: 'GenerateDeployArtifacts',
          project: genProject,
          input: sourceOutput,
          outputs: [genOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new cpactions.CodeDeployEcsDeployAction({
          actionName: 'CodeDeployBlueGreen',
          deploymentGroup,
          appSpecTemplateInput: genOutput,
          taskDefinitionTemplateInput: genOutput,
        }),
      ],
    });
  }
}
