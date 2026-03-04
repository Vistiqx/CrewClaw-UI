/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ["dockerode", "ssh2", "better-sqlite3"],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
