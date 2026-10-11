import { FormEvent, useState } from "react";

import { confirmPasswordReset } from "@/services/password-reset.service";


export function useResetPassword(uid: string, token: string) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setNewPasswordError("");
        setConfirmPasswordError("");
        setError("");

        let hasErrors = false;

        if (!newPassword) {
            setNewPasswordError("Ingresá una contraseña nueva.");
            hasErrors = true;
        } else if (newPassword.length < 8) {
            setNewPasswordError("La contraseña debe tener al menos 8 caracteres.");
            hasErrors = true;
        }

        if (!confirmPassword) {
            setConfirmPasswordError("Repetí la contraseña nueva.");
            hasErrors = true;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError("Las contraseñas no coinciden.");
            hasErrors = true;
        }

        if (hasErrors) return;

        setLoading(true);

        try {
            const response = await confirmPasswordReset({
                uid,
                token,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setMessage(response.detail);
        } catch {
            setError(
                "No se pudo cambiar la contraseña. El enlace puede ser inválido o haber vencido.",
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        newPasswordError,
        setNewPasswordError,
        confirmPasswordError,
        setConfirmPasswordError,
        message,
        error,
        loading,
        handleSubmit,
    };
}
