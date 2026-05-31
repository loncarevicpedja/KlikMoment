import type { NextConfig } from "next";

const devHost = process.env.DEV_HOST;

const nextConfig: NextConfig = {
  // Allow phone/tablet access during local dev (e.g. http://192.168.0.106:3000)
  ...(devHost ? { allowedDevOrigins: [devHost] } : {}),
  images: {
    localPatterns: [
      {
        pathname: "/api/media",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
};

export default nextConfig;
