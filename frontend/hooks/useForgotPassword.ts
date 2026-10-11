import { useState } from "react";

import { requestPasswordReset } from "@/services/password-reset.service";


export function useForgotPassword() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setEmailError("");
        setMessage("");
        setError("");

        const normalizedEmail = email.trim();

        if (!normalizedEmail) {
            setEmailError("El correo electrónico es obligatorio.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            setEmailError("Ingresá un correo electrónico válido.");
            return;
        }

        setLoading(true);

        try {
            const response = await requestPasswordReset(normalizedEmail);
            setMessage(response.detail);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("No se pudo solicitar la recuperación.");
            }
        } finally {
            setLoading(false);
        }
    }

    return {
        email,
        setEmail,
        emailError,
        setEmailError,
        message,
        error,
        loading,
        handleSubmit,
    };
}
