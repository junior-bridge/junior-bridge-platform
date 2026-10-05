"use client";

import { useUser } from "@/context/UserContext";
import { Bell, CheckCheck } from "lucide-react";

const notificationsByRole: Record<string, { id: number; title: string; body: string; time: string; read: boolean; type: string }[]> = {
  emprendedor: [
    { id: 1, title: "Nueva postulación", body: "Roxana Pop se postuló a tu proyecto SaaS Dashboard", time: "Hace 2h", read: false, type: "postulation" },
    { id: 2, title: "Bug reportado", body: "Se registró el bug #BUG-1025 en SaaS Dashboard", time: "Hace 4h", read: false, type: "bug" },
    { id: 3, title: "Tester aceptado", body: "Trevor Guy fue aceptado en App Fintech", time: "Ayer", read: true, type: "info" },
  ],
  tester: [
    { id: 1, title: "Postulación aceptada", body: "Fuiste aceptado en el proyecto CRM Empresarial", time: "Hace 1h", read: false, type: "success" },
    { id: 2, title: "Nueva calificación", body: "Recibiste 5 estrellas por tu trabajo en App Delivery", time: "Hace 3h", read: false, type: "star" },
    { id: 3, title: "Proyecto disponible", body: "Se publicó un nuevo proyecto que coincide con tus skills", time: "Ayer", read: true, type: "info" },
  ],
  admin: [
    { id: 1, title: "Nuevo usuario registrado", body: "Trevor Guy se registró como tester", time: "Hace 30min", read: false, type: "user" },
    { id: 2, title: "Bug crítico reportado", body: "Bug #BUG-1026 con riesgo ALTO en SaaS Dashboard", time: "Hace 1h", read: false, type: "bug" },
    { id: 3, title: "Proyecto publicado", body: "CRM Empresarial fue publicado por Ana López", time: "Hace 2h", read: true, type: "info" },
  ],
};

const typeColors: Record<string, string> = {
  postulation: "bg-blue-100 text-blue-600",
  bug: "bg-red-100 text-red-600",
  info: "bg-gray-100 text-gray-500",
  success: "bg-green-100 text-green-600",
  star: "bg-orange-100 text-orange-500",
  user: "bg-purple-100 text-purple-600",
};

export default function NotificationsPage() {
  const { user } = useUser();
  if (!user) return null;

  const notifications = notificationsByRole[user.role] ?? [];
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="px-6 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-1">{unread} sin leer</p>
        </div>
        <button className="flex items-center gap-1 text-xs text-[#2d6a4f] font-medium hover:underline">
          <CheckCheck size={13} /> Marcar todas como leídas
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.map((n) => (
          <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-start gap-3 ${!n.read ? "border-l-4 border-[#2d6a4f]" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeColors[n.type]}`}>
              <Bell size={14} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                <span className="text-[10px] text-gray-400">{n.time}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-[#2d6a4f] mt-1 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
