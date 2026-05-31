import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { EcrStack } from '../lib/stacks/ecr-stack';

describe('EcrStack', () => {
  const app = new cdk.App();
  const stack = new EcrStack(app, 'TestEcrStack');
  const template = Template.fromStack(stack);

  it('ECRリポジトリが2つ作成される', () => {
    template.resourceCountIs('AWS::ECR::Repository', 2);
  });

  it('DEV APIリポジトリが正しい名前で作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/api-dev',
    });
  });

  it('DEV Webリポジトリが正しい名前で作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/web-dev',
    });
  });

  it('プッシュ時のイメージスキャンが有効化される', () => {
    const repos = template.findResources('AWS::ECR::Repository');
    for (const repo of Object.values(repos)) {
      expect(repo.Properties?.ImageScanningConfiguration?.ScanOnPush).toBe(true);
    }
  });

  it('ライフサイクルポリシーが設定される（最新20件保持）', () => {
    const repos = template.findResources('AWS::ECR::Repository');
    for (const repo of Object.values(repos)) {
      const policyText: string = repo.Properties?.LifecyclePolicy?.LifecyclePolicyText ?? '';
      expect(policyText).toContain('"countNumber":20');
    }
  });

  it('削除保護が設定される（RETAIN）', () => {
    template.hasResource('AWS::ECR::Repository', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  it('タグのミュータビリティがMUTABLEに設定される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageTagMutability: 'MUTABLE',
    });
  });
});

describe('EcrStack (enableStg=true)', () => {
  const app = new cdk.App();
  const stack = new EcrStack(app, 'TestEcrStackWithStg', { enableStg: true });
  const template = Template.fromStack(stack);

  it('DEV+STGで4つのリポジトリが作成される', () => {
    template.resourceCountIs('AWS::ECR::Repository', 4);
  });

  it('STG APIリポジトリが作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/api-stg',
    });
  });

  it('STG Webリポジトリが作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/web-stg',
    });
  });
});

describe('EcrStack (enableStg=true, enableProd=true)', () => {
  const app = new cdk.App();
  const stack = new EcrStack(app, 'TestEcrStackFull', { enableStg: true, enableProd: true });
  const template = Template.fromStack(stack);

  it('DEV+STG+PRODで6つのリポジトリが作成される', () => {
    template.resourceCountIs('AWS::ECR::Repository', 6);
  });

  it('PROD APIリポジトリが作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/api-prod',
    });
  });

  it('PROD Webリポジトリが作成される', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      RepositoryName: 'forge-ts/web-prod',
    });
  });
});
