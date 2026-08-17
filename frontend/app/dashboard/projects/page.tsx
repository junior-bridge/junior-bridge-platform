"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Plus, ChevronRight, Search } from "lucide-react";

const emprendedorProjects = [
  { id: "PRJ-001", name: "SaaS Dashboard", description: "Plataforma de gestión empresarial", testers: 3, bugs: 8, progress: 65, status: "IN PROGRESS", created: "01 Ago 2026" },
  { id: "PRJ-002", name: "App Fintech", description: "Aplicación de pagos móviles", testers: 1, bugs: 2, progress: 90, status: "IN REVIEW", created: "15 Jul 2026" },
  { id: "PRJ-003", name: "E-commerce Platform", description: "Tienda online con carrito y checkout", testers: 2, bugs: 15, progress: 100, status: "PUBLISHED", created: "10 Jun 2026" },
];

const testerProjects = [
  { id: "PRJ-004", name: "CRM Empresarial", owner: "Martin Díaz", skills: ["Web", "CRM"], deadline: "18 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-005", name: "App de Salud", owner: "Laura Sosa", skills: ["Mobile", "iOS"], deadline: "22 Ago 2026", status: "ABIERTO" },
  { id: "PRJ-006", name: "Plataforma Educativa", owner: "Carlos Ruiz", skills: ["Web", "UX"], deadline: "10 Ago 2026", status: "CERRADO" },
];

const adminProjects = [
  { id: "PRJ-001", name: "SaaS Dashboard", owner: "Martin Díaz", testers: 3, bugs: 8, status: "IN PROGRESS", created: "01 Ago 2026" },
  { id: "PRJ-002", name: "App Fintech", owner: "Laura Sosa", testers: 1, bugs: 2, status: "IN REVIEW", created: "15 Jul 2026" },
  { id: "PRJ-003", name: "E-commerce", owner: "Carlos Ruiz", testers: 2, bugs: 15, status: "PUBLISHED", created: "10 Jun 2026" },
];

const statusColors: Record<string, string> = {
  "IN PROGRESS": "bg-green-100 text-green-700",
  "IN REVIEW": "bg-orange-100 text-orange-600",
  "PUBLISHED": "bg-teal-100 text-teal-700",
  "ABIERTO": "bg-green-100 text-green-700",
  "CERRADO": "bg-gray-100 text-gray-400",
};

export default function ProjectsPage() {
  const { user, isClient, isTester, isAdmin } = useUser();
  if (!user) return null;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Proyectos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isClient && "Gestioná tus proyectos publicados"}
            {isTester && "Explorá proyectos disponibles"}
            {isAdmin && "Todos los proyectos de la plataforma"}
          </p>
        </div>
        {isClient && (
          <Link href="/dashboard/projects/new" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition" style={{ backgroundColor: "#e07b39" }}>
            <Plus size={15} /> Nuevo Proyecto
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 border border-gray-200 mb-6">
        <Search size={15} className="text-gray-400" />
        <input type="text" placeholder="Buscar proyecto..." className="bg-transparent text-sm outline-none w-full placeholder-gray-400" />
      </div>

      {isClient && (
        <div className="flex flex-col gap-4">
          {emprendedorProjects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-gray-400">{p.description}</p>
                </div>
                <button className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1">Ver <ChevronRight size={12} /></button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${p.progress}%`, backgroundColor: "#2d6a4f" }} />
                </div>
                <span className="text-xs text-gray-400">{p.progress}%</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{p.testers} testers</span>
                <span>{p.bugs} bugs</span>
                <span>Creado: {p.created}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTester && (
        <div className="flex flex-col gap-4">
          {testerProjects.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">por {p.owner}</p>
                <div className="flex gap-1">{p.skills.map((s) => <span key={s} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                <p className="text-[10px] text-gray-400 mt-1">Cierre: {p.deadline}</p>
              </div>
              {p.status === "ABIERTO" && (
                <button className="ml-4 shrink-0 rounded-lg px-4 py-2 text-white text-xs font-semibold hover:opacity-90" style={{ backgroundColor: "#2d6a4f" }}>Postularme</button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                {["ID", "Proyecto", "Emprendedor", "Testers", "Bugs", "Estado", "Creado"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {adminProjects.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.id}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium text-xs">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.owner}</td>
                  <td className="px-4 py-3 text-gray-600 text-center text-xs">{p.testers}</td>
                  <td className="px-4 py-3 text-gray-600 text-center text-xs">{p.bugs}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
