"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUser } from "@/context/UserContext";
import { loginUser, startOAuth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);

  async function handleLogin(
    event: React.SyntheticEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      setUser(response.user);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(
    provider: "google" | "github") {
    setError("");

    const flow = provider === "google" ? "entrepreneur" : "tester";

    setOauthLoading(provider);

    try {
      const response = await startOAuth("google", "login",);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      window.location.assign(`${apiUrl}${response.login_url}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo iniciar la autenticación con el proveedor seleccionado.");
      }
    
      setOauthLoading(null);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#dde8e5] rounded-3xl border-2 border-[#71A398] p-8 w-full max-w-lg shadow-xl">
        <div className="bg-white rounded-2xl px-10 py-10">
        <div className="flex flex-col items-center mb-6">

          <Image
            src="/logo.png"
            alt="Juniorbridge"
            width={160}
            height={50}
            priority
            className="mb-2 h-auto"
          />

          <p className="text-gray-600 text-sm">Inicia sesión para continuar</p>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={oauthLoading !== null}
            className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          > 
            <Image
              src="/google.png"
              alt="Google"
              width={20}
              height={20}
              className="h-auto"
            />

            {oauthLoading === "google" ? 
              "Iniciando sesión..." : "Continúa con Google"}
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={oauthLoading !== null}  
            className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image
              src="/github.png"
              alt="GitHub"
              width={20}
              height={20}
              className="h-auto"
            />  

            {oauthLoading === "github" ?
              "Iniciando sesión..." : "Continúa con GitHub"}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <hr className="flex-1 border-gray-200" />

          <span className="text-xs text-gray-400">o ingresa</span>

          <hr className="flex-1 border-gray-200" />
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-gray-700">Correo Electrónico</label>
            
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-gray-700">Contraseña</label>

            <input
              id="password"
              name="password"
              type="password" 
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || oauthLoading !== null}
            className="w-full rounded-full py-2.5 text-white text-sm font-semibold transition hover:opacity-90 mt-1 disabled:opacity-60"
            style={{ backgroundColor: "#e07b39" }}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form> 

        <p className="text-center text-xs text-gray-500 mt-5">
          ¿No tienes una cuenta?{" "}
          <Link 
            href="/register" 
            className= "underline"
            style={{ color: "#e07b39" }}
            > 
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  </main>
  );
}



