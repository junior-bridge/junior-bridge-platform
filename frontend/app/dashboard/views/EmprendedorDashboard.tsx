"use client";

import { ChevronRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ProjectItem from "@/components/dashboard/ProjectItem";
import PostulationCard from "@/components/dashboard/PostulationCard";

const stats = [
  { label: "Proyectos Publicados", value: 3 },
  { label: "Postulaciones Nuevas", value: 5 },
  { label: "Reportes Recibidos", value: 8 },
  { label: "Testers Calificados", value: 2 },
];

const projects = [
  { name: "SaaS Dashboard", description: "Módulo principal", status: "IN PROGRESS", progress: 65, statusColor: "bg-green-100 text-green-700" },
  { name: "SaaS Dashboard", description: "Interacción", status: "IN REVIEW", progress: 90, statusColor: "bg-orange-100 text-orange-600" },
  { name: "SaaS Dashboard", description: "Pasarela de pago", status: "PUBLISHED", progress: 100, statusColor: "bg-teal-100 text-teal-700" },
];

const reports = [
  { id: "#BUG-1024", description: "Fallo en pasarela de pago", priority: "ALTA", priorityColor: "bg-red-100 text-red-600" },
  { id: "#BUG-1025", description: "Retraso en carga de transacciones", priority: "MEDIA", priorityColor: "bg-yellow-100 text-yellow-700" },
];

const postulations = [
  { name: "Roxana Pop", role: "Mobile Tester", stars: 4 },
  { name: "Ringo Star", role: "Security Tester", stars: 3.5 },
  { name: "Trevor Guy", role: "UI/UX Tester", stars: 3 },
];

interface Props { userName: string }

export default function EmprendedorDashboard({ userName }: Props) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hola, {userName}</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tienes {projects.filter(p => p.status === "IN PROGRESS").length} proyectos activos y{" "}
            {stats.find(s => s.label === "Postulaciones Nuevas")?.value} postulaciones nuevas hoy.
          </p>
        </div>
        <button className="rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#e07b39" }}>
          Publicar proyecto
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} />)}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Mis Proyectos</h2>
              <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">
                Ver Todo <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {projects.map((p, i) => <ProjectItem key={i} {...p} />)}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Reportes recientes</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left pb-2 font-semibold">ID</th>
                  <th className="text-left pb-2 font-semibold">Descripción</th>
                  <th className="text-left pb-2 font-semibold">Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-600 font-medium">{r.id}</td>
                    <td className="py-3 text-gray-600">{r.description}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.priorityColor}`}>{r.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-52 bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Postulaciones</h2>
          <div className="flex flex-col gap-4">
            {postulations.map((p) => <PostulationCard key={p.name} {...p} onView={() => {}} />)}
          </div>
        </div>
      </div>
    </main>
  );
}
