
import { AuthResponse } from "@/types/authTypes";
import { LoginData } from "@/types/loginTypes";
import { getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";

export async function loginUser(data: LoginData): Promise<AuthResponse> {
    await getCsrfToken();

    return apiFetch<AuthResponse>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}