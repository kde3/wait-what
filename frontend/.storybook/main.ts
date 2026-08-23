import type { StorybookConfig } from '@storybook/nextjs-vite';
import tailwindcss from '@tailwindcss/vite';

const embeddedBuild = process.env.npm_lifecycle_event === 'build-storybook';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: embeddedBuild ? [] : ['../public'],
  async viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(tailwindcss());
    return config;
  },
};

export default config;
