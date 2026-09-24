import { AuthResponse } from "@/types/authTypes";
import { RegisterData } from "@/types/registerTypes";
import { getCsrfToken } from "./auth.service";

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
    await getCsrfToken();

    try {
        return await apiFetch<AuthResponse>("/api/auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.toLowerCase().includes("already exists") ||
                error.message.toLowerCase().includes("already registered") ||
                error.message.toLowerCase().includes("duplicate"))
        ) {
            throw new Error(
                "Ya existe un usuario registrado con ese correo electrónico.",
            );
        }

        throw error;
    }
}
