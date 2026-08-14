"use client";

import { ChevronRight, Users, FolderOpen, Bug, Star } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

const stats = [
  { label: "Usuarios Registrados", value: 148 },
  { label: "Proyectos Activos", value: 23 },
  { label: "Bugs Reportados", value: 312 },
  { label: "Testers Activos", value: 41 },
];

const recentUsers = [
  { name: "Roxana Pop", role: "tester", email: "roxana@mail.com", joined: "08 Ago 2026", status: "activo" },
  { name: "Martin Díaz", role: "emprendedor", email: "martin@mail.com", joined: "07 Ago 2026", status: "activo" },
  { name: "Trevor Guy", role: "tester", email: "trevor@mail.com", joined: "06 Ago 2026", status: "pendiente" },
  { name: "Laura Sosa", role: "emprendedor", email: "laura@mail.com", joined: "05 Ago 2026", status: "activo" },
];

const recentProjects = [
  { name: "SaaS Dashboard", owner: "Martin Díaz", testers: 3, bugs: 8, status: "IN PROGRESS" },
  { name: "App Fintech", owner: "Laura Sosa", testers: 1, bugs: 2, status: "IN REVIEW" },
  { name: "E-commerce", owner: "Carlos Ruiz", testers: 2, bugs: 15, status: "PUBLISHED" },
];

const roleColors: Record<string, string> = {
  tester: "bg-blue-100 text-blue-700",
  emprendedor: "bg-orange-100 text-orange-700",
  admin: "bg-purple-100 text-purple-700",
};
const statusColors: Record<string, string> = {
  activo: "bg-green-100 text-green-700",
  pendiente: "bg-yellow-100 text-yellow-700",
};
const projectStatusColors: Record<string, string> = {
  "IN PROGRESS": "bg-green-100 text-green-700",
  "IN REVIEW": "bg-orange-100 text-orange-600",
  "PUBLISHED": "bg-teal-100 text-teal-700",
};

interface Props { userName: string }

export default function AdminDashboard({ userName }: Props) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {userName}</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de la plataforma JuniorBridge.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} />)}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-4">

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Users size={16} className="text-[#2d6a4f]" /> Usuarios Recientes</h2>
              <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">Ver Todo <ChevronRight size={12} /></button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold">Nombre</th>
                  <th className="text-left pb-2 font-semibold">Rol</th>
                  <th className="text-left pb-2 font-semibold">Email</th>
                  <th className="text-left pb-2 font-semibold">Registro</th>
                  <th className="text-left pb-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.email} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-gray-700 font-medium">{u.name}</td>
                    <td className="py-2.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span></td>
                    <td className="py-2.5 text-gray-400 text-xs">{u.email}</td>
                    <td className="py-2.5 text-gray-400 text-xs">{u.joined}</td>
                    <td className="py-2.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[u.status]}`}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><FolderOpen size={16} className="text-[#2d6a4f]" /> Proyectos Recientes</h2>
              <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">Ver Todo <ChevronRight size={12} /></button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold">Proyecto</th>
                  <th className="text-left pb-2 font-semibold">Emprendedor</th>
                  <th className="text-left pb-2 font-semibold">Testers</th>
                  <th className="text-left pb-2 font-semibold">Bugs</th>
                  <th className="text-left pb-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.name} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-gray-700 font-medium">{p.name}</td>
                    <td className="py-2.5 text-gray-400 text-xs">{p.owner}</td>
                    <td className="py-2.5 text-gray-600 text-center">{p.testers}</td>
                    <td className="py-2.5 text-gray-600 text-center">{p.bugs}</td>
                    <td className="py-2.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${projectStatusColors[p.status]}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-52 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Bug size={15} className="text-red-400" /> Bugs Recientes</h2>
            <div className="flex flex-col gap-2">
              {[
                { id: "#BUG-1026", project: "SaaS Dashboard", priority: "ALTA", color: "bg-red-100 text-red-600" },
                { id: "#BUG-1025", project: "App Fintech", priority: "MEDIA", color: "bg-yellow-100 text-yellow-700" },
                { id: "#BUG-1024", project: "E-commerce", priority: "BAJA", color: "bg-green-100 text-green-700" },
              ].map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{b.id}</p>
                    <p className="text-[10px] text-gray-400">{b.project}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.color}`}>{b.priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Star size={15} className="text-orange-400" /> Top Testers</h2>
            <div className="flex flex-col gap-2">
              {[
                { name: "Roxana Pop", score: "4.9 ★" },
                { name: "Trevor Guy", score: "4.7 ★" },
                { name: "Ringo Star", score: "4.5 ★" },
              ].map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}.</span>
                  <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{t.name}</p>
                    <p className="text-[10px] text-orange-500">{t.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
