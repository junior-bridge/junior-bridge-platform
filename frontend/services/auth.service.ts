import { OAuthFlow, OAuthProcess, OAuthProvider, OAuthStartResponse } from "@/types/authTypes";
import { apiFetch } from "./index.service";
import { getCsrfToken } from "@/lib/csrf";

export { getCsrfToken } from "@/lib/csrf";

export async function startOAuth(
    provider: OAuthProvider,
    process: OAuthProcess,
    flow?: OAuthFlow,
): Promise<OAuthStartResponse> {
    await getCsrfToken();

    return apiFetch<OAuthStartResponse>(`/api/auth/oauth/${provider}/start/`, {
        method: "POST",
        body: JSON.stringify({
            process,
            ...(flow ? { flow } : {}),
        }),
    });
}

export async function getWebSocketTicket(): Promise<string> {
    const data = await apiFetch<{ ticket: string }>("/api/auth/ws-ticket/", {
        method: "POST",
    });

    return data.ticket;
}
