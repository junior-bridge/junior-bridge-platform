"use client";

import Image from "next/image";
import Link from "next/link";


import AuthCard from "@/components/ui/AuthCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RoleSelector from "@/components/auth/RoleSelector";
import { useUser } from "@/context/UserContext";
import { useRegister } from "@/hooks/useRegister";

export default function RegisterPage() {
    const { setUser } = useUser();
    const {
        form,
        setForm,
        selectedRole,
        setSelectedRole ,
        acceptedTerms,
        setAcceptedTerms,
        fieldErrors,
        setFieldErrors,
        error,
        setError,
        loading,
        oauthLoading,
        isEntrepreneur,
        handleRegister,
        handleOAuth
    }=useRegister(setUser)
   

    return (
        <AuthCard
            title="Crea tu cuenta"
            description="Elegí cómo querés participar en JuniorBridge."
        >
            <div className="flex flex-col gap-3 mb-5">
                <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={oauthLoading !== null}
                    className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Image
                        src="/google.png"
                        alt="Google"
                        width={20}
                        height={20}
                    />

                    {oauthLoading === "google"
                        ? "Conectando..."
                        : "Continúa con Google"}
                </button>

                <button
                    type="button"
                    onClick={() => handleOAuth("github")}
                    disabled={oauthLoading !== null}
                    className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Image
                        src="/github.png"
                        alt="GitHub"
                        width={20}
                        height={20}
                    />

                    {oauthLoading === "github"
                        ? "Conectando..."
                        : "Continúa con GitHub"}
                </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
                <hr className="flex-1 border-gray-200" />

                <span className="text-xs text-gray-400">o regístrate</span>

                <hr className="flex-1 border-gray-200" />
            </div>

            <RoleSelector
                value={selectedRole}
                onChange={(role) => {
                    setSelectedRole(role);
                    setError("");
                }}
            />

            <div className="min-h-[315px]">
                {isEntrepreneur ? (
                    <form
                        className="flex flex-col gap-4"
                        onSubmit={handleRegister}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                id="name"
                                name="name"
                                label="Nombre"
                                type="text"
                                autoComplete="given-name"
                                value={form.name}
                                onChange={(event) => {
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value
                                    }));
                                    setFieldErrors((current) => ({
                                        ...current,
                                        name: undefined,
                                    }));
                                }}
                                required
                                error={fieldErrors.name}
                                helperText="Solo necesitamos tu nombre real."
                            />

                            <Input
                                id="surname"
                                name="surname"
                                label="Apellido"
                                type="text"
                                autoComplete="family-name"
                                value={form.surname}
                                onChange={(event) => {
                                    setForm((current) => ({
                                        ...current,
                                        surname: event.target.value
                                    }));
                                    setFieldErrors((current) => ({
                                        ...current,
                                        surname: undefined,
                                    }));
                                }}
                                required
                                error={fieldErrors.surname}
                                helperText="Escribí tu apellido tal como figura en tu perfil."
                            />
                        </div>

                        <Input
                            id="email"
                            name="email"
                            label="Correo electrónico"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    email: event.target.value
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    email: undefined,
                                }));
                            }}
                            required
                            error={fieldErrors.email}
                            helperText="Usá un correo válido; lo necesitarás para iniciar sesión."
                        />

                        <Input
                            id="password"
                            name="password"
                            label="Contraseña"
                            type="password"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    password: event.target.value
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    password: undefined,
                                }));
                            }}
                            minLength={8}
                            required
                            error={fieldErrors.password}
                            helperText="Debe tener al menos 8 caracteres, una mayúscula y un carácter especial"
                        />

                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirmar contraseña"
                            type="password"
                            autoComplete="new-password"
                            value={form.confirmPassword}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    confirmPassword: event.target.value
                                }));
                                setFieldErrors((current) => ({
                                    ...current,
                                    confirmPassword: undefined,
                                }));
                            }}
                            minLength={8}
                            required
                            error={fieldErrors.confirmPassword}
                            helperText="Repetí exactamente la contraseña anterior."
                        />

                        <label className="flex items-start gap-2 text-xs text-gray-500">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(event) =>
                                    setAcceptedTerms(event.target.checked)
                                }
                                className="mt-0.5"
                            />

                            <span>
                                Acepto los términos de servicio y la política de
                                privacidad de JuniorBridge.
                            </span>
                        </label>

                        {error && (
                            <p className="text-sm text-red-500 text-center">
                                {error}
                            </p>
                        )}

                        <Button type="submit" loading={loading}>
                            Crear cuenta
                        </Button>
                    </form>
                ) : (
                    <div className="h-full min-h-[315px] flex flex-col items-center justify-center text-center px-4">
                        <p className="text-sm font-medium text-gray-700">
                            Registro como Tester Junior
                        </p>

                        <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-xs">
                            El registro de Tester se realizará mediante Google o
                            GitHub.
                        </p>

                        {error && (
                            <p className="text-sm text-red-500 text-center mt-4">
                                {error}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-gray-500 mt-5">
                ¿Ya tienes una cuenta?{" "}
                <Link
                    href="/login"
                    className="underline"
                    style={{ color: "#e07b39" }}
                >
                    Inicia sesión
                </Link>
            </p>
        </AuthCard>
    );
}
