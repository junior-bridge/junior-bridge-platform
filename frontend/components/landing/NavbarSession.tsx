"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import LandingButton from "@/components/landing/LandingButton";
import { useUser } from "@/context/UserContext";

export default function NavbarSession() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <span aria-hidden="true" className="h-11 w-36" />;
  }

  if (!user) {
    return (
      <LandingButton href="/login" variant="outline" size="sm">
        Iniciar sesión
      </LandingButton>
    );
  }

  return (
    <Link
      href="/dashboard"
      aria-label={`Ir al panel de ${user.name}`}
      className="inline-flex items-center gap-2 rounded-[10px] border-2 border-brand-green px-5 py-2 font-bold leading-tight text-brand-green transition-[filter] hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
    >
      <UserRound aria-hidden="true" className="size-5" />
      {user.name}
    </Link>
  );
}
