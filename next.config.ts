import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/National_Triage_Command_AI",
  assetPrefix: "/National_Triage_Command_AI/",
};

export default nextConfig;