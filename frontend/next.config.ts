import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    return [{ source: '/storybook', destination: '/storybook/index.html' }];
  },
};

export default nextConfig;
