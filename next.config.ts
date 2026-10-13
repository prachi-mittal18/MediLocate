
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  logging: {
    incomingRequests: {
      ignore: [/\/api\/emergency\/status/],
    },
  },
};

export default nextConfig;
