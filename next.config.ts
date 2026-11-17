import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "192.168.*.*",
    "10.*.*.*",
  ],
  // O certificado da Supabase é lido do disco pelas rotas /api (src/lib/db.ts):
  // garante que ele vá junto no deploy.
  outputFileTracingIncludes: {
    "/api/**": ["./db/supabase-ca.crt"],
  },
};

export default nextConfig;