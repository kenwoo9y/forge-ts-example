import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: [
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../features/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],
  framework: getAbsolutePath('@storybook/react-vite'),
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite');
    const { default: react } = await import('@vitejs/plugin-react');

    // @storybook/react-vite adds @vitejs/plugin-react, which picks up the
    // project's babel.config.js. The mobile babel config sets
    // jsxImportSource:'nativewind' which breaks JSX in the Storybook context
    // (causing "React is not defined"). Replace it with a version that
    // ignores the babel config file so Vite uses esbuild's automatic runtime.
    const plugins = (config.plugins ?? [])
      .flat()
      .filter(
        (p): p is NonNullable<typeof p> =>
          !!p &&
          typeof p === 'object' &&
          'name' in p &&
          p.name !== 'vite:react-babel' &&
          p.name !== 'vite:react-refresh'
      );

    return mergeConfig(
      { ...config, plugins },
      {
        plugins: react({ babel: { configFile: false } }),
        resolve: {
          alias: [
            // Exact match only — prevents 'react-native/Libraries/...' deep imports
            // from being incorrectly rewritten to 'react-native-web/Libraries/...'
            { find: /^react-native$/, replacement: 'react-native-web' },
            {
              find: 'expo-router',
              replacement: resolve(__dirname, './__mocks__/expo-router.ts'),
            },
            {
              find: '@react-native-community/datetimepicker',
              replacement: resolve(
                __dirname,
                './__mocks__/@react-native-community/datetimepicker.ts'
              ),
            },
            {
              find: 'react-native-safe-area-context',
              replacement: resolve(__dirname, './__mocks__/react-native-safe-area-context.ts'),
            },
          ],
        },
      }
    );
  },
};

export default config;
