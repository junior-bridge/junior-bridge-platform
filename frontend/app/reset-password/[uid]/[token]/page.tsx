"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import AuthCard from "@/components/ui/AuthCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useResetPassword } from "@/hooks/useResetPassword";


export default function ResetPasswordPage() {
    const params = useParams<{ uid: string; token: string }>();
    const {
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
    } = useResetPassword(params.uid, params.token);

    return (
        <AuthCard
            title="Crear nueva contraseña"
            description={
                message
                    ? ""
                    : "Ingresá y confirmá la contraseña que vas a usar para iniciar sesión."
            }
        >
            {message ? (
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-green-700">{message}</p>

                    <Link
                        href="/login"
                        className="text-sm text-gray-600 underline"
                    >
                        Ir al inicio de sesión
                    </Link>
                </div>
            ) : (
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <Input
                        id="new-password"
                        name="new-password"
                        label="Nueva contraseña"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => {
                            setNewPassword(event.target.value);
                            setNewPasswordError("");
                        }}
                        required
                        error={newPasswordError}
                        helperText="Debe tener al menos 8 caracteres."
                    />

                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        label="Confirmar contraseña"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => {
                            setConfirmPassword(event.target.value);
                            setConfirmPasswordError("");
                        }}
                        required
                        error={confirmPasswordError}
                    />

                    {error && (
                        <p className="text-xs text-red-500 text-center">
                            {error}
                        </p>
                    )}

                    <Button type="submit" loading={loading}>
                        Guardar nueva contraseña
                    </Button>

                    {error && (
                        <Link
                            href="/forgot-password"
                            className="text-center text-sm text-gray-600 underline"
                        >
                            Solicitar un enlace nuevo
                        </Link>
                    )}
                </form>
            )}
        </AuthCard>
    );
}
