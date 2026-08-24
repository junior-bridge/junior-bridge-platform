"use client";

import { useUser } from "@/context/UserContext";
import { Plus } from "lucide-react";

const emprendedorReports = [
  { id: "#BUG-1024", project: "SaaS Dashboard", tester: "Roxana Pop", description: "Fallo en pasarela de pago al usar Visa", risk: "ALTA", status: "ABIERTO", date: "07 Ago 2026" },
  { id: "#BUG-1025", project: "SaaS Dashboard", tester: "Trevor Guy", description: "Retraso en carga de transacciones", risk: "MEDIA", status: "EN REVISIÓN", date: "06 Ago 2026" },
  { id: "#BUG-1023", project: "App Fintech", tester: "Ringo Star", description: "El botón de logout no responde en mobile", risk: "BAJA", status: "RESUELTO", date: "04 Ago 2026" },
];

const testerReports = [
  { id: "#BUG-1024", project: "CRM Empresarial", description: "Fallo en módulo de contactos", risk: "ALTA", status: "ABIERTO", date: "07 Ago 2026" },
  { id: "#BUG-1019", project: "CRM Empresarial", description: "Error de validación en formulario", risk: "MEDIA", status: "RESUELTO", date: "05 Ago 2026" },
];

const adminReports = [
  { id: "#BUG-1026", project: "SaaS Dashboard", tester: "Roxana Pop", description: "Error crítico en pagos", risk: "ALTA", status: "ABIERTO", date: "08 Ago 2026" },
  { id: "#BUG-1025", project: "SaaS Dashboard", tester: "Trevor Guy", description: "Retraso en carga de transacciones", risk: "MEDIA", status: "EN REVISIÓN", date: "07 Ago 2026" },
  { id: "#BUG-1024", project: "App Fintech", tester: "Ringo Star", description: "Logout no responde en mobile", risk: "BAJA", status: "RESUELTO", date: "06 Ago 2026" },
];

const riskColors: Record<string, string> = { ALTA: "bg-red-100 text-red-600", MEDIA: "bg-yellow-100 text-yellow-700", BAJA: "bg-green-100 text-green-700" };
const statusColors: Record<string, string> = { ABIERTO: "bg-blue-100 text-blue-700", "EN REVISIÓN": "bg-orange-100 text-orange-600", RESUELTO: "bg-teal-100 text-teal-700" };

export default function ReportsPage() {
  const { user } = useUser();
  if (!user) return null;

  const reports = user.role === "TESTER" ? testerReports : user.role === "CLIENT" ? emprendedorReports : adminReports;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user.role === "CLIENT" && "Bugs reportados en tus proyectos"}
            {user.role === "TESTER" && "Tus reportes de bugs enviados"}
            {user.role === "ADMIN" && "Todos los reportes de la plataforma"}
            {user.role === "CLIENT" && "Bugs reportados en tus proyectos"}
            {user.role === "TESTER" && "Tus reportes de bugs enviados"}
            {user.role === "ADMIN" && "Todos los reportes de la plataforma"}
          </p>
        </div>
        
        {user.role === "TESTER" && (
          <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#e07b39" }}>
            <Plus size={15} /> Nuevo Reporte
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold">ID</th>
              <th className="text-left px-4 py-3 font-semibold">Proyecto</th>
              {user.role !== "TESTER" && <th className="text-left px-4 py-3 font-semibold">Tester</th>}
              {user.role !== "TESTER" && <th className="text-left px-4 py-3 font-semibold">Tester</th>}
              <th className="text-left px-4 py-3 font-semibold">Descripción</th>
              <th className="text-left px-4 py-3 font-semibold">Riesgo</th>
              <th className="text-left px-4 py-3 font-semibold">Estado</th>
              <th className="text-left px-4 py-3 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-gray-500 font-medium text-xs">{r.id}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{r.project}</td>
                {user.role !== "TESTER" && <td className="px-4 py-3 text-gray-500 text-xs">{"TESTER" in r ? String(r.TESTER) : ""}</td>}
                <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${riskColors[r.risk]}`}>{r.risk}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
