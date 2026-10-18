import { User } from "@/types";
import { AdminUser } from "@/types/dashboardTypes";
import { clearCsrfToken, getCsrfToken } from "@/lib/csrf";
import { apiFetch } from "./index.service";
import { API_BASE } from "@/lib/apiBase";

export async function getProfile(): Promise<User> {
    return apiFetch<User>("/api/auth/profile/");
}

export async function logoutUser(): Promise<void> {
    await apiFetch("/api/auth/logout/", {
        method: "POST",
    });
}

export async function updateProfilePhoto(file: File): Promise<User> {
    const csrfToken = await getCsrfToken();

    const formData = new FormData();
    formData.append("profile_photo_upload", file);

    let response: Response;
    try {
        response = await fetch(`${API_BASE}/api/auth/profile/`, {
            method: "PUT",
            headers: {
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: formData,
        });
    } finally {
        clearCsrfToken();
    }

    if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}));
        if (
            typeof errorData === "object" &&
            errorData !== null &&
            "profile_photo_upload" in errorData
        ) {
            const detail = errorData.profile_photo_upload;
            throw new Error(
                Array.isArray(detail) ? detail.join(" ") : String(detail),
            );
        }
        throw new Error("No se pudo actualizar la foto de perfil.");
    }

    return response.json() as Promise<User>;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>("/api/users/");
}