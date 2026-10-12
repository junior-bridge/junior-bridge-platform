import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  title: string;
  children?: ReactNode;
  tone?: "light" | "dark";
  centered?: boolean;
}

export default function SectionHeading({
  id,
  title,
  children,
  tone = "light",
  centered = false,
}: SectionHeadingProps) {
  const subtitleColor = tone === "dark" ? "text-white/85" : "text-(--lp-mute)";
  const alignment = centered ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-[36em] ${alignment}`}>
      <h2
        id={id}
        className="mb-3 text-[clamp(1.8rem,3.6vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.8px]"
      >
        {title}
      </h2>
      {children && <div className={`text-lg ${subtitleColor}`}>{children}</div>}
    </div>
  );
}
