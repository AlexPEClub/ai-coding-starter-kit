import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/verwaltung/wissensbasis",
        destination: "/verwaltung/cms/wissensbasis",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
