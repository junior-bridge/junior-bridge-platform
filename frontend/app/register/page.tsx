"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthCard from "@/components/ui/AuthCard";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RoleSelector, {
  type RegistrationRole,
} from "@/components/auth/RoleSelector";
import { registerUser } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useUser();

  const [selectedRole, setSelectedRole] =
    useState<RegistrationRole>("emprendedor");

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEntrepreneur = selectedRole === "emprendedor";

  async function handleRegister(
    event: React.SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!acceptedTerms) {
      setError(
        "Debes aceptar los términos de servicio y la política de privacidad.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!isEntrepreneur) {
      setError(
        "El registro de Tester Junior se realizará mediante Google o GitHub.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        password,
      });
      
      setUser(response.user);

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo completar el registro.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: "google" | "github") {
    setError("");

    if (isEntrepreneur && provider === "github") {
      setError("GitHub corresponde al flujo de Tester Junior.");
      return;
    }

    setError(
      `El registro con ${
        provider === "google" ? "Google" : "GitHub"
      } se implementará en el flujo OAuth.`,
    );
  }

  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Elegí cómo querés participar en JuniorBridge."
    >
      <div className="flex flex-col gap-3 mb-5">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          <Image 
            src="/google.png"
            alt="Google"
            width={20}
            height={20}
          />
          Continúa con Google
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("github")}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          <Image 
            src="/github.png"
            alt="GitHub"
            width={20}
            height={20}
          />
          Continúa con GitHub
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <hr className="flex-1 border-gray-200" />

        <span className="text-xs text-gray-400">
          o regístrate
        </span>

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
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />

              <Input
                id="surname"
                name="surname"
                label="Apellido"
                type="text"
                autoComplete="family-name"
                value={surname}
                onChange={(event) => setSurname(event.target.value)}
                required
              />
            </div>

            <Input
              id="email"
              name="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <Input
              id="password"
              name="password"
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={8}
              required
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

            <Button
              type="submit"
              loading={loading}
            >
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
              GitHub. Este flujo se habilitará con OAuth.
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