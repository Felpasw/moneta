import { readFileSync } from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

const readVersion = (pkgPath: string): string => {
  const raw = readFileSync(pkgPath, "utf-8");
  return (JSON.parse(raw) as { version: string }).version;
};

const WEB_VERSION = readVersion(path.resolve(__dirname, "package.json"));
const API_VERSION = readVersion(
  path.resolve(__dirname, "..", "api", "package.json"),
);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_WEB_VERSION: WEB_VERSION,
    NEXT_PUBLIC_API_VERSION: API_VERSION,
  },
};

export default nextConfig;
