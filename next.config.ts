import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.26"],
};

export default nextConfig;
