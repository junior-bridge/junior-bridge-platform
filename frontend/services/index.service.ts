import { ApiError } from "@/types";
import { getCookie } from "./auth.service";
import { API_BASE } from "@/lib/apiBase";

export class ApiRequestError extends Error {
    readonly data: ApiError;

    constructor(message: string, data: ApiError) {
        super(message);
        this.name = "ApiRequestError";
        this.data = data;
    }
}

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const method = options.method?.toUpperCase() ?? "GET";

    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const csrfToken = getCookie("csrftoken");

        if (!csrfToken) {
            throw new Error("No se encontró el token CSRF.");
        }

        headers.set("X-CSRFToken", csrfToken);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        let error: ApiError = {
            detail: "Ocurrió un error inesperado.",
        };

        try {
            error = await response.json();
        } catch { }

        if (
            Array.isArray(error.non_field_errors) &&
            typeof error.non_field_errors[0] === "string"
        ) {
            throw new ApiRequestError(error.non_field_errors[0], error);
        }

        if (
            Array.isArray(error.email) &&
            error.email.some(
                (message) =>
                    typeof message === "string" &&
                    message.toLowerCase().includes("already exists"),
            )
        ) {
            throw new ApiRequestError(
                "Ya existe un usuario registrado con ese correo electrónico.",
                error,
            );
        }

        throw new ApiRequestError(
            typeof error.detail === "string"
                ? error.detail
                : "No se pudo completar la solicitud.",
            error,
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export async function refreshToken(): Promise<void> {
    await apiFetch("/api/auth/token/refresh/", {
        method: "POST",
    });
}