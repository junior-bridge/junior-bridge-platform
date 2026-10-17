const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE?.trim() ?? "";

export const API_BASE = (
    /^https?:\/\//i.test(configuredApiBase)
        ? configuredApiBase
        : configuredApiBase
          ? `https://${configuredApiBase}`
          : ""
).replace(/\/+$/, "");

const configuredWsBase =
    process.env.NEXT_PUBLIC_WS_BASE?.trim() ||
    "wss://junior-bridge-api.onrender.com";

export const API_WEBSOCKET_BASE = (API_BASE || configuredWsBase)
    .replace(/^http/i, "ws")
    .replace(/\/+$/, "");
