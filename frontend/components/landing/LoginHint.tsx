"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";

export default function LoginHint() {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return null;
  }

  return (
    <p className="mt-5 text-[0.95rem] text-(--lp-mute)">
      ¿Ya tienes cuenta?{" "}
      <Link
        href="/login"
        className="rounded-sm font-bold text-brand-green underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
      >
        Inicia sesión
      </Link>
      .
    </p>
  );
}
