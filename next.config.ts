import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // This causes the double render in dev
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // give-credit.test
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "give-credit.test",
      },
      {
        protocol: "https",
        hostname: "admin.givecredit.au",
      },
    ],
  },
};

export default nextConfig;
