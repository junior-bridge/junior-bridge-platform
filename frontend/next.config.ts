import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    skipTrailingSlashRedirect: true,
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination:
                    "https://junior-bridge-api.onrender.com/api/:path*",
            },
            {
                source: "/accounts/:path*",
                destination:
                    "https://junior-bridge-api.onrender.com/accounts/:path*",
            },
        ];
    },
};

export default nextConfig;
