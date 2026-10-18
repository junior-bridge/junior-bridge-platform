// Same-origin mode: set NEXT_PUBLIC_API_BASE to "/" so API_BASE is "" and every
// request uses a relative URL on the frontend origin, which Next.js rewrites
// proxy to the API (see next.config.ts). This keeps the API cookies first-party,
// since browsers that block third-party cookies drop them cross-site.
const configuredApiBase =
  process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000";

export const API_BASE =
  configuredApiBase === "/"
    ? ""
    : (
        /^https?:\/\//i.test(configuredApiBase)
          ? configuredApiBase
          : `https://${configuredApiBase}`
      ).replace(/\/+$/, "");

// Next.js rewrites do not reliably proxy WebSocket upgrades, so the socket can
// point at its own origin with NEXT_PUBLIC_WS_BASE (for example wss://api-host).
const configuredWsBase = process.env.NEXT_PUBLIC_WS_BASE?.trim().replace(/\/+$/, "");

export const API_WEBSOCKET_BASE =
  configuredWsBase || API_BASE.replace(/^http/i, "ws");
