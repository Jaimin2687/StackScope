import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Prevent heavy server-only packages from being bundled into client chunks
  serverExternalPackages: [
    "groq-sdk",
    "@google/generative-ai",
    "stripe",
    "jspdf",
  ],
};

export default nextConfig;
