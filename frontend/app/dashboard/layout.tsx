"use client";

import { useState } from "react";
import { Search, Menu, X } from "lucide-react";
import { useUser } from "@/context/UserContext";
import Sidebar from "@/components/dashboard/Sidebar";
import { NotificationBell } from "../../components/NotificationBell";
import { useDashboard } from "@/hooks/useDashboard";
import { User } from "@/types";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout, isAuthenticated, isLoading } = useUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { router, handleLogout, displayName, avatarInitials, roleLabel } =
        useDashboard({ isLoading, isAuthenticated, logout, user });

    if (isLoading) return null;
    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#f5f0eb] overflow-hidden">

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div
                className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 ease-in-out lg:static lg:transform-none ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                <Sidebar
                    userName={user.name}
                    userRole={user.role as User["role"]}
                    onLogout={handleLogout}
                    onNavigate={() => setSidebarOpen(false)}
                />
            </div>

            
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                
                <header className="bg-[#f5f0eb] px-4 sm:px-6 py-3 flex items-center justify-between border-b border-gray-200 shrink-0 gap-3">

                    
                    <button
                        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition shrink-0"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <Menu size={20} />
                    </button>

                    
                    <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 flex-1 max-w-xs border border-gray-200">
                        <Search size={15} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-transparent text-sm outline-none w-full text-gray-600 placeholder-gray-400"
                        />
                    </div>

                    
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800 leading-tight">
                                    {displayName}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {roleLabel[user.role] ?? user.role}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {avatarInitials}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
