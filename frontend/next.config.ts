import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [{ source: "/uk", destination: "/", permanent: true }];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/ru" },
      { source: "/eu", destination: "/ru" },
      { source: "/auth", destination: "/ru/auth" },
      { source: "/dashboard", destination: "/ru/dashboard" },
      { source: "/dashboard/:section", destination: "/ru/dashboard/:section" },
    ];
  },
};

export default config;
