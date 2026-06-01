import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.cloud.appwrite.io",
                port: "",
                pathname: "/v1/storage/buckets/**",
            },
        ],
    },
};

export default nextConfig;
