"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, FolderOpen, ClipboardList, FileText,
  User, Bell, Settings, LogOut, Users, BarChart2, Bug,
} from "lucide-react";
import type { User as ApiUser } from "@/lib/api";

const navByRole: Record<ApiUser["role"], { icon: React.ElementType; label: string; href: string }[]> = {
  CLIENT: [
    { icon: Home, label: "Inicio", href: "/dashboard" },
    { icon: FolderOpen, label: "Proyectos", href: "/dashboard/projects" },
    { icon: ClipboardList, label: "Postulaciones", href: "/dashboard/postulations" },
    { icon: FileText, label: "Reportes recibidos", href: "/dashboard/reports" },
    { icon: User, label: "Mi Perfil", href: "/dashboard/profile" },
    { icon: Bell, label: "Notificaciones", href: "/dashboard/notifications" },
  ],
  TESTER: [
    { icon: Home, label: "Inicio", href: "/dashboard" },
    { icon: FolderOpen, label: "Proyectos", href: "/dashboard/projects" },
    { icon: Bug, label: "Mis Reportes", href: "/dashboard/reports" },
    { icon: BarChart2, label: "Mi Reputación", href: "/dashboard/reputation" },
    { icon: User, label: "Mi Perfil", href: "/dashboard/profile" },
    { icon: Bell, label: "Notificaciones", href: "/dashboard/notifications" },
  ],
  ADMIN: [
    { icon: Home, label: "Inicio", href: "/dashboard" },
    { icon: Users, label: "Usuarios", href: "/dashboard/users" },
    { icon: FolderOpen, label: "Proyectos", href: "/dashboard/projects" },
    { icon: Bug, label: "Reportes", href: "/dashboard/reports" },
    { icon: BarChart2, label: "Estadísticas", href: "/dashboard/stats" },
    { icon: Bell, label: "Notificaciones", href: "/dashboard/notifications" },
  ],
};

const roleLabel: Record<ApiUser["role"], string> = {
  CLIENT: "Emprendedor",
  TESTER: "Tester",
  ADMIN: "Admin",
};

interface SidebarProps {
  userName: string;
  userRole: ApiUser["role"];
  onLogout: () => void;
}

export default function Sidebar({ userName, userRole, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navByRole[userRole] ?? navByRole.CLIENT;

  return (
    <aside className="w-48 bg-[#2d6a4f] flex flex-col justify-between py-6 px-4 shrink-0">
      <div>
        <div className="mb-1">
          <Image src="/logo.png" alt="Juniorbridge" width={130} height={40} className="h-auto brightness-0 invert" />
        </div>
        <p className="text-green-200 text-xs text-center mb-6">{roleLabel[userRole]}</p>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? "bg-green-700 text-white font-semibold" : "text-green-100 hover:bg-green-700"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
            {userName[0].toUpperCase()}
          </div>
          <p className="text-green-100 text-xs font-medium truncate">{userName}</p>
        </div>

        {userRole === "CLIENT" && (
          <Link
            href="/dashboard/projects/new"
            className="w-full rounded-full py-2 text-white text-sm font-semibold text-center hover:opacity-90 transition"
            style={{ backgroundColor: "#e07b39" }}
          >
            Publicar proyecto
          </Link>
        )}

        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-100 hover:bg-green-700 text-sm transition">
          <Settings size={16} /> Configuración
        </Link>

        <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-100 hover:bg-green-700 text-sm transition text-left w-full">
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
