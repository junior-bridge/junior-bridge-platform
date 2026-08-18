"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { useUser } from "@/context/UserContext";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;
  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const roleLabel: Record<string, string> = {
    CLIENT: "Emprendedor",
    TESTER: "Tester",
    ADMIN: "Admin",
  };

  return (
    <div className="flex h-screen bg-[#f5f0eb] overflow-hidden">
      <Sidebar
        userName={user.name}
        userRole={user.role}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#f5f0eb] px-6 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 border border-gray-200">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-gray-500" />
            <div className="w-px h-6 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-400">{roleLabel[user.role] ?? user.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
                {user.name[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
