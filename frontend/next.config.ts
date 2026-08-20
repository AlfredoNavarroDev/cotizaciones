import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone: el Dockerfile copia solo .next/standalone + .next/static + public,
  // sin necesitar node_modules completo en la imagen final.
  output: "standalone",
};

export default nextConfig;
