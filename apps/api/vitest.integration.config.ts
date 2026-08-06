import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../packages/config/vitest/vitest.config.ts';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      root: '.',
      include: ['integration/**/*.integration.test.ts'],
      setupFiles: ['./integration/setup.ts'],
      // 全テストファイルが同一の実DBを共有し、テストごとにTRUNCATEで状態をリセットするため、ファイル並列実行を許すとTRUNCATEと他ファイルのテストが競合してしまう。
      fileParallelism: false,
      // 実DBに対する結合テストのみを対象にするため、Unitテスト向けのカバレッジ閾値は適用しない。
      coverage: {
        enabled: false,
      },
    },
  })
);
