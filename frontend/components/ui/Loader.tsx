interface LoaderProps {
  size?: number;
  color?: string;
  label?: string;
  fullPage?: boolean;
}

export default function Loader({
  size = 24,
  color = "#e07b39",
  label,
  fullPage = false,
}: LoaderProps) {
  const spinner = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {label && (
            <p className="text-sm font-medium text-gray-600">{label}</p>
          )}
        </div>
      </div>
    );
  }

  if (label) {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
    );
  }

  return spinner;
}
