import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose Barewire and GlobalCheck environment variables for server-side use
  env: {
    BAREWIRE_URL: process.env.BAREWIRE_URL || 'https://proxy.barewire.com', // Barewire Edge Proxy URL
    GLOBALCHECK_API_KEY: process.env.GLOBALCHECK_API_KEY || '', // GlobalCheck API Key
    GLOBALCHECK_POLICY_ID: process.env.GLOBALCHECK_POLICY_ID || '', // GlobalCheck Policy ID
  },
  
  // Barewire integration: Set up a rewrite rule for an internal proxy
  // This allows the Next.js application to route its LLM API calls securely
  // through the Barewire Edge Proxy. Any requests from your Next.js app
  // to `/api/barewire/v1/messages` will be rewritten to
  // `BAREWIRE_URL/v1/messages` on the server before being sent out.
  async rewrites() {
    return [
      {
        source: '/api/barewire/:path*', // Internal Next.js API route to be proxied
        destination: `${process.env.BAREWIRE_URL || 'https://proxy.barewire.com'}/:path*`,
      },
    ];
  },
  
  /* config options here */
};

export default nextConfig;
