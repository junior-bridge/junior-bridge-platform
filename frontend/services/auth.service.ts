import { OAuthFlow, OAuthProcess, OAuthProvider, OAuthStartResponse } from "@/types/authTypes";
import { apiFetch } from "./index.service";
import { API_BASE } from "@/lib/apiBase";

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") {
        return null;
    }

    const cookies = document.cookie.split("; ");

    for (const cookie of cookies) {
        const [key, ...value] = cookie.split("=");

        if (key === name) {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
}

export async function getCsrfToken(): Promise<void> {
    const url = `${API_BASE}/api/auth/csrf/`;
    const response = await fetch(url, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("No se pudo obtener el token CSRF.");
    }
}

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
