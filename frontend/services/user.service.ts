import { User } from "@/types";
import { AdminUser } from "@/types/dashboardTypes";
import { getCookie, getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";

export async function getProfile(): Promise<User> {
    return apiFetch<User>("/api/auth/profile/");
}

export async function logoutUser(): Promise<void> {
    await apiFetch("/api/auth/logout/", {
        method: "POST",
    });
}

export async function updateProfilePhoto(file: File): Promise<User> {
    await getCsrfToken();
    const csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
        throw new Error("No se encontró el token CSRF.");
    }

    const formData = new FormData();
    formData.append("profile_photo_upload", file);

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/profile/`,
        {
            method: "PUT",
            headers: {
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: formData,
        },
    );

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