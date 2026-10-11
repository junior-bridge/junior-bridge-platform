"use client";

import Link from "next/link";

import AuthCard from "@/components/ui/AuthCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useForgotPassword } from "@/hooks/useForgotPassword";


export default function ForgotPasswordPage() {
    const {
        email,
        setEmail,
        emailError,
        setEmailError,
        message,
        error,
        loading,
        handleSubmit,
    } = useForgotPassword();

    return (
        <AuthCard
            title="Recuperar contraseña"
            description={
                message
                    ? ""
                    : "Ingresá tu correo y te enviaremos un enlace para crear una contraseña nueva."
            }
        >
            {message ? (
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-green-700">{message}</p>

                    <Link
                        href="/login"
                        className="text-sm text-gray-600 underline"
                    >
                        Volver al inicio de sesión
                    </Link>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <Input
                        id="email"
                        name="email"
                        label="Correo electrónico"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setEmailError("");
                        }}
                        required
                        error={emailError}
                        helperText="Usá el correo asociado a tu cuenta."
                    />

                    {error && (
                        <p className="text-xs text-red-500 text-center">
                            {error}
                        </p>
                    )}

                    <Button type="submit" loading={loading}>
                        Enviar enlace de recuperación
                    </Button>

                    <Link
                        href="/login"
                        className="text-center text-sm text-gray-600 underline"
                    >
                        Volver al inicio de sesión
                    </Link>
                </form>
            )}
        </AuthCard>
    );
}
