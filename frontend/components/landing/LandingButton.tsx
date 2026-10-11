"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

type ButtonVariant = "primary" | "outline";
type ButtonSize = "md" | "sm";

interface LandingButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  authenticatedLabel?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-brand-orange text-white",
  outline: "border-brand-green text-brand-green",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-7 py-[13px] text-base",
  sm: "px-5 py-2 text-base",
};

export default function LandingButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  authenticatedLabel = "Ir a mi panel",
}: LandingButtonProps) {
  const { isAuthenticated } = useUser();

  return (
    <Link
      href={isAuthenticated ? "/dashboard" : href}
      className={`inline-block rounded-[10px] border-2 font-bold leading-tight transition-[filter] hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-orange ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {isAuthenticated ? authenticatedLabel : children}
    </Link>
  );
}
