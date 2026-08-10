"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
const navigate = useRouter();
const handleLogin = () => {
  navigate.push("/dashboard");
};

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border-16 border-[#71A398] shadow-xl w-full max-w-md px-10 py-10">
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
          <button className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <Image src="/google.png" alt="Google" width={20} height={20} className="h-auto" />
            Continúa con Google
          </button>

          <button className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-full py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
            <Image src="/github.png" alt="GitHub" width={20} height={20} className="h-auto" />
            Continúa con GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">o ingresa</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm text-gray-700">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-gray-500 hover:underline">
                Olvidé mi contraseña
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-full py-2.5 text-white text-sm font-semibold transition hover:opacity-90 mt-1"
            style={{ backgroundColor: "#e07b39" }}
            onClick={handleLogin}
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="underline" style={{ color: "#e07b39" }}>
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
