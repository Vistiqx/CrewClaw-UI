/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('dockerode');
      config.externals.push('ssh2');
      config.externals.push('better-sqlite3');
    }
    return config;
  },
};

export default nextConfig;
