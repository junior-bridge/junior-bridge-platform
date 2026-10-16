import type { NextConfig } from "next";

// Solo dentro de la imagen E2E. Evita el rewrite de develop hacia Render.
const config: NextConfig = {
    async rewrites() {
        return [{ source: "/api/:path*", destination: "http://backend:8000/api/:path*" }];
    },
};
export default config;
