import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#e07b39] text-white hover:opacity-90",
  secondary: "bg-[#2f7f70] text-white hover:opacity-90",
  outline:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
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
      className={`w-full rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-60 ${variantClasses[variant]} ${className}`}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}