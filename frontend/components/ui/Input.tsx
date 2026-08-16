import type { InputHTMLAttributes } from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm text-gray-700"
      >
        {label}
      </label>

      <input
        id={id}
        {...props}
        className={`border border-gray-300 rounded-md px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-teal-600
          ${error ? "border-red-400" : ""}
          ${className}`}
      />

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}