import { User } from "@/types";
import { apiFetch } from "./index.service";

export async function getProfile(): Promise<User> {
    return apiFetch<User>("/api/auth/profile/");
}

export async function logoutUser(): Promise<void> {
    await apiFetch("/api/auth/logout/", {
        method: "POST",
    });
}