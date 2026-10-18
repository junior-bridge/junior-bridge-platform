import { getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";


type PasswordResetResponse = {
    detail: string;
};

type ConfirmPasswordResetData = {
    uid: string;
    token: string;
    new_password: string;
    confirm_password: string;
};


export async function requestPasswordReset(
    email: string,
): Promise<PasswordResetResponse> {
    await getCsrfToken();

    return apiFetch<PasswordResetResponse>("/api/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}


export async function confirmPasswordReset(
    data: ConfirmPasswordResetData,
): Promise<PasswordResetResponse> {
    await getCsrfToken();

    return apiFetch<PasswordResetResponse>(
        "/api/auth/password-reset/confirm/",
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}
