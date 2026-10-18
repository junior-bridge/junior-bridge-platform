const configuredApiBase =
  process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000";

export const API_BASE = (
  /^https?:\/\//i.test(configuredApiBase)
    ? configuredApiBase
    : `https://${configuredApiBase}`
).replace(/\/+$/, "");

export const API_WEBSOCKET_BASE = API_BASE.replace(/^http/i, "ws");
