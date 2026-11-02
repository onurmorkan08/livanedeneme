import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/lead-radar.html", destination: "/lead-radar/login", permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;
