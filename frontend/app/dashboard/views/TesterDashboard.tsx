"use client";

import { ChevronRight, Star } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

const stats = [
  { label: "Proyectos Completados", value: 12 },
  { label: "Bugs Reportados", value: 87 },
  { label: "Reputación Promedio", value: "4.6 ★" },
  { label: "Postulaciones Activas", value: 2 },
];

const availableProjects = [
  { id: "PRJ-001", name: "SaaS Dashboard", description: "Testing de módulo de pagos y transacciones", skills: ["Web", "Pagos"], deadline: "20 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-002", name: "App Mobile Fintech", description: "Testing funcional de app iOS/Android", skills: ["Mobile", "iOS"], deadline: "25 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-003", name: "E-commerce Platform", description: "Testing de flujo de compra y checkout", skills: ["Web"], deadline: "15 Ago 2026", status: "CERRADO" },
];

const activeProject = { name: "CRM Empresarial", description: "Reporte de bugs en módulo de contactos", progress: 70, bugsReported: 4, deadline: "18 Ago 2026" };

const ratings = [
  { project: "Plataforma Educativa", stars: 5, comment: "Excelente reporte, muy detallado", date: "Jul 2026" },
  { project: "App Delivery", stars: 4, comment: "Buena puntualidad y calidad", date: "Jun 2026" },
  { project: "Marketplace B2B", stars: 4, comment: "Cumplió con todos los entregables", date: "May 2026" },
];

function StarDisplay({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} fill={i <= stars ? "#f97316" : "none"} stroke={i <= stars ? "#f97316" : "#d1d5db"} />
      ))}
    </div>
  );
}

interface Props { userName: string }

export default function TesterDashboard({ userName }: Props) {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hola, {userName}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tenés 1 proyecto activo y {availableProjects.filter(p => p.status === "ABIERTO").length} proyectos disponibles para postularte.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => <StatCard key={stat.label} label={stat.label} value={stat.value} />)}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 flex flex-col gap-4">
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Proyecto Activo</h2>
            <div className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{activeProject.name}</p>
                  <p className="text-xs text-gray-400">{activeProject.description}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">EN CURSO</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${activeProject.progress}%`, backgroundColor: "#2d6a4f" }} />
                </div>
                <span className="text-xs text-gray-400">{activeProject.progress}%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{activeProject.bugsReported} bugs reportados</span>
                <span>Entrega: {activeProject.deadline}</span>
              </div>
              <button className="mt-3 w-full rounded-lg py-1.5 text-white text-xs font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#e07b39" }}>
                Reportar Bug
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Proyectos Disponibles</h2>
              <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">
                Ver Todo <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {availableProjects.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === "ABIERTO" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{p.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {p.skills.map((s) => (
                        <span key={s} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Cierre: {p.deadline}</p>
                  </div>
                  {p.status === "ABIERTO" && (
                    <button className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-white text-xs font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#2d6a4f" }}>
                      Postularme
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-56 bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-1">Mi Reputación</h2>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-800">4.6</span>
            <div>
              <StarDisplay stars={5} />
              <p className="text-[10px] text-gray-400 mt-0.5">12 proyectos</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {ratings.map((r) => (
              <div key={r.project} className="border-b border-gray-50 pb-2 last:border-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs font-semibold text-gray-700">{r.project}</p>
                  <span className="text-[10px] text-gray-400">{r.date}</span>
                </div>
                <StarDisplay stars={r.stars} />
                <p className="text-[10px] text-gray-400 mt-0.5 italic">"{r.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
