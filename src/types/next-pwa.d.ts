declare module "next-pwa" {
  import type { NextConfig } from "next";

  type RuntimeCachingRule = {
    urlPattern: RegExp | ((context: { request: Request; url: URL }) => boolean);
    handler: "CacheFirst" | "NetworkFirst" | "StaleWhileRevalidate";
    options?: Record<string, unknown>;
  };

  type PWAConfig = {
    dest: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    runtimeCaching?: RuntimeCachingRule[];
  };

  export default function withPWAInit(
    config: PWAConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
