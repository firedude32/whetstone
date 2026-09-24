import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Policies are read from disk at runtime; make sure deploys ship them.
  outputFileTracingIncludes: {
    "/*": ["./policies/**/*.md"],
  },
};

export default nextConfig;
