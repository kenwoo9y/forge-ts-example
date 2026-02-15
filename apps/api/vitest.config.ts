import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../packages/config/vitest/vitest.config.ts';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      root: '.',
      exclude: ['node_modules', 'dist', 'src/infrastructure/**'],
      coverage: {
        include: ['src/**'],
        exclude: [
          'src/infrastructure/**',
          'src/index.ts',
          'src/**/dto.ts',
          'src/**/repository.ts',
          'src/**/queryService.ts',
          'src/domain/shared/valueObject.ts',
        ],
      },
    },
  })
);
