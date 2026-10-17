import { ApiError } from "@/types";
import { clearCsrfToken, getCsrfToken } from "@/lib/csrf";
import { API_BASE } from "@/lib/apiBase";

export class ApiRequestError extends Error {
    readonly data: ApiError;

    constructor(message: string, data: ApiError) {
        super(message);
        this.name = "ApiRequestError";
        this.data = data;
    }
}

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

async function performRequest(
    endpoint: string,
    options: RequestInit = {},
): Promise<Response> {
    const method = options.method?.toUpperCase() ?? "GET";

    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (WRITE_METHODS.includes(method)) {
        headers.set("X-CSRFToken", await getCsrfToken());
    }

    try {
        return await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            credentials: "include",
        });
    } finally {
        if (WRITE_METHODS.includes(method)) {
            clearCsrfToken();
        }
    }
}

function buildApiRequestError(error: ApiError): ApiRequestError {
    if (
        Array.isArray(error.non_field_errors) &&
        typeof error.non_field_errors[0] === "string"
    ) {
        return new ApiRequestError(error.non_field_errors[0], error);
    }

    if (
        Array.isArray(error.email) &&
        error.email.some(
            (message) =>
                typeof message === "string" &&
                message.toLowerCase().includes("already exists"),
        )
    ) {
        return new ApiRequestError(
            "Ya existe un usuario registrado con ese correo electrónico.",
            error,
        );
    }

    return new ApiRequestError(
        typeof error.detail === "string"
            ? error.detail
            : "No se pudo completar la solicitud.",
        error,
    );
}

async function errorFromResponse(response: Response): Promise<ApiRequestError> {
    let error: ApiError = {
        detail: "Ocurrió un error inesperado.",
    };

    try {
        error = await response.json();
    } catch {
        // Mantiene el mensaje por defecto cuando el body no es JSON.
    }

    return buildApiRequestError(error);
}

export async function refreshToken(): Promise<void> {
    const response = await performRequest("/api/auth/token/refresh/", {
        method: "POST",
    });

    if (!response.ok) {
        throw await errorFromResponse(response);
    }
}

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    let response = await performRequest(endpoint, options);

    if (response.status === 401 && endpoint !== "/api/auth/token/refresh/") {
        try {
            await refreshToken();
        } catch {
            // El refresh falló; el reintento de abajo mostrará el 401 original.
        }

        response = await performRequest(endpoint, options);
    }

    if (!response.ok) {
        throw await errorFromResponse(response);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}