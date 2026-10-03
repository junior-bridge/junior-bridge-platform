import type { ButtonHTMLAttributes, ReactNode } from "react";
import Loader from "./Loader";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-[#e07b39] text-white hover:bg-[#c9622a]",
  secondary: "bg-[#2d6a4f] text-white hover:bg-[#1f4d39]",
  outline:   "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
};

const loaderColor: Record<ButtonVariant, string> = {
  primary:   "#ffffff",
  secondary: "#ffffff",
  outline:   "#e07b39",
};

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`w-full rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <Loader size={16} color={loaderColor[variant]} />
      )}
      {loading ? "Cargando..." : children}
    </button>
  );
}
