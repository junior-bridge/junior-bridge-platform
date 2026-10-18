import { API_BASE } from "@/lib/apiBase";

type CsrfTokenResponse = {
    csrfToken: string;
};

let csrfToken: string | null = null;
let csrfTokenRequest: Promise<string> | null = null;

export async function getCsrfToken(): Promise<string> {
    if (csrfToken) {
        return csrfToken;
    }

    if (!csrfTokenRequest) {
        csrfTokenRequest = (async () => {
            const response = await fetch(`${API_BASE}/api/auth/csrf/`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("No se pudo obtener el token CSRF.");
            }

            const data: CsrfTokenResponse = await response.json();
            if (!data.csrfToken) {
                throw new Error("La respuesta no incluyó el token CSRF.");
            }

            csrfToken = data.csrfToken;
            return csrfToken;
        })().finally(() => {
            csrfTokenRequest = null;
        });
    }

    return csrfTokenRequest;
}

export function clearCsrfToken(): void {
    csrfToken = null;
}
