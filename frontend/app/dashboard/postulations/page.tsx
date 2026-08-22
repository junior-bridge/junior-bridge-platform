"use client";

import { useUser } from "@/context/UserContext";
import { Star } from "lucide-react";

const emprendedorPostulations = [
  { id: "POST-001", project: "SaaS Dashboard", testerName: "Roxana Pop", role: "Mobile Tester", stars: 4.9, date: "07 Ago 2026", status: "PENDIENTE" },
  { id: "POST-002", project: "SaaS Dashboard", testerName: "Trevor Guy", role: "UI/UX Tester", stars: 4.2, date: "06 Ago 2026", status: "ACEPTADO" },
  { id: "POST-003", project: "App Fintech", testerName: "Ringo Star", role: "Security Tester", stars: 3.8, date: "05 Ago 2026", status: "RECHAZADO" },
];

const testerPostulations = [
  { id: "POST-010", project: "CRM Empresarial", owner: "Ana López", appliedDate: "07 Ago 2026", status: "ACEPTADO" },
  { id: "POST-011", project: "SaaS Dashboard", owner: "Martin Díaz", appliedDate: "05 Ago 2026", status: "PENDIENTE" },
  { id: "POST-012", project: "App Delivery", owner: "Pedro Ruiz", appliedDate: "20 Jul 2026", status: "RECHAZADO" },
];

const statusColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  ACEPTADO: "bg-green-100 text-green-700",
  RECHAZADO: "bg-red-100 text-red-600",
};

export default function PostulationsPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Postulaciones</h1>
        <p className="text-gray-500 text-sm mt-1">
          {user.role === "CLIENT" ? "Testers que se postularon a tus proyectos" : "Tus postulaciones a proyectos"}
        </p>
      </div>

      {user.role === "CLIENT" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                {["Tester", "Proyecto", "Reputación", "Fecha", "Estado", "Acción"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {emprendedorPostulations.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold">{p.testerName[0]}</div>
                      <div>
                        <p className="text-gray-700 font-medium text-xs">{p.testerName}</p>
                        <p className="text-gray-400 text-[10px]">{p.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{p.project}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= Math.round(p.stars) ? "#f97316" : "none"} stroke={i <= Math.round(p.stars) ? "#f97316" : "#d1d5db"} />)}
                      <span className="text-xs text-gray-500 ml-1">{p.stars}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.date}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span></td>
                  <td className="px-4 py-3">
                    {p.status === "PENDIENTE" && (
                      <div className="flex gap-2">
                        <button className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-green-600 text-white hover:opacity-90">Aceptar</button>
                        <button className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:opacity-90">Rechazar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user.role === "TESTER" && (
        <div className="flex flex-col gap-4">
          {testerPostulations.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{p.project}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-400">Emprendedor: {p.owner}</p>
                <p className="text-xs text-gray-400">Postulado: {p.appliedDate}</p>
              </div>
              {p.status === "ACEPTADO" && (
                <button className="ml-4 rounded-lg px-4 py-2 text-white text-xs font-semibold hover:opacity-90" style={{ backgroundColor: "#e07b39" }}>Ir al Proyecto</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
