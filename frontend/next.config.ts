import type { NextConfig } from "next";

// Server-only origin of the Django API (for example
// https://junior-bridge-api-n1o6.onrender.com). When it is set, the browser
// talks only to the frontend origin and Next.js proxies API and allauth
// routes, so the API cookies stay first-party. When it is unset (local dev),
// no rewrites are added and the browser calls NEXT_PUBLIC_API_BASE directly.
const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "");

const proxiedPrefixes = ["api", "accounts"];

const nextConfig: NextConfig = {
    // Django relies on trailing slashes (APPEND_SLASH); do not let Next strip them.
    skipTrailingSlashRedirect: true,
    async rewrites() {
        if (!apiProxyTarget) {
            return [];
        }
        // The "/:path*/" variant comes first so the trailing slash is forwarded.
        return proxiedPrefixes.flatMap((prefix) => [
            {
                source: `/${prefix}/:path*/`,
                destination: `${apiProxyTarget}/${prefix}/:path*/`,
            },
            {
                source: `/${prefix}/:path*`,
                destination: `${apiProxyTarget}/${prefix}/:path*`,
            },
        ]);
    },
};

export default nextConfig;
