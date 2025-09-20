import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // allow these remote hosts (simple, clean for common CDNs)
    domains: [
      'img.freepik.com',
      'encrypted-tbn0.gstatic.com',
      // add any other hostnames you need
    ],
    // use remotePatterns when you need protocol/port/path (e.g. localhost:3000)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/directory/**',
      },
    ],
  },
};

export default nextConfig;
