import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: "export",
    basePath: "/National_Triage_Command_AI",
    assetPrefix: "/National_Triage_Command_AI/",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;