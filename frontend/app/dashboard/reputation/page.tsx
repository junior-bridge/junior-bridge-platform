"use client";

import { useUser } from "@/context/UserContext";
import { Star } from "lucide-react";

const ratings = [
  { project: "Plataforma Educativa", emprendedor: "Carlos Ruiz", stars: 5, quality: 5, punctuality: 5, compliance: 5, comment: "Excelente reporte, muy detallado.", date: "Jul 2026" },
  { project: "App Delivery", emprendedor: "Pedro Ruiz", stars: 4, quality: 4, punctuality: 4, compliance: 4, comment: "Buena puntualidad y calidad general.", date: "Jun 2026" },
  { project: "Marketplace B2B", emprendedor: "Laura Sosa", stars: 4, quality: 5, punctuality: 3, compliance: 4, comment: "Cumplió con todos los entregables.", date: "May 2026" },
];

function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= value ? "#f97316" : "none"} stroke={i <= value ? "#f97316" : "#d1d5db"} />)}
      </div>
    </div>
  );
}

export default function ReputationPage() {
  const { user } = useUser();
  if (!user || user.role !== "TESTER") return <div className="px-6 py-6"><p className="text-gray-500">Esta sección es solo para testers.</p></div>;

  const avg = (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Reputación</h1>
        <p className="text-gray-500 text-sm mt-1">Tu historial de calificaciones como tester</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Promedio General", value: `${avg} ★` },
          { label: "Proyectos Completados", value: ratings.length },
          { label: "Calidad de Reporte", value: "4.8 ★" },
          { label: "Puntualidad", value: "4.6 ★" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {ratings.map((r) => (
          <div key={r.project} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{r.project}</h3>
                <p className="text-xs text-gray-400">por {r.emprendedor} · {r.date}</p>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= r.stars ? "#f97316" : "none"} stroke={i <= r.stars ? "#f97316" : "#d1d5db"} />)}
                <span className="text-sm font-bold text-gray-700 ml-1">{r.stars}.0</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 mb-3">
              <StarRow label="Calidad del reporte" value={r.quality} />
              <StarRow label="Puntualidad" value={r.punctuality} />
              <StarRow label="Cumplimiento" value={r.compliance} />
            </div>
            <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">"{r.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
