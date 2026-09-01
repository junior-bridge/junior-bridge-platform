import type { ReactNode } from "react";
import Image from "next/image";

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  description,
  children,
}: AuthCardProps) {
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

            <h1 className="text-xl font-semibold text-gray-800">
              {title}
            </h1>

            <p className="text-gray-600 text-sm mt-1 text-center">
              {description}
            </p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}