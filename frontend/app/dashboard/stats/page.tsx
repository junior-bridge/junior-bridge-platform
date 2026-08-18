"use client";

import { useUser } from "@/context/UserContext";
import StatCard from "@/components/dashboard/StatCard";

const monthlyData = [
  { month: "Mar", bugs: 28 }, { month: "Abr", bugs: 45 }, { month: "May", bugs: 62 },
  { month: "Jun", bugs: 89 }, { month: "Jul", bugs: 134 }, { month: "Ago", bugs: 312 },
];
const maxBugs = Math.max(...monthlyData.map(d => d.bugs));

const topTesters = [
  { name: "Roxana Pop", bugs: 48, projects: 6, avg: "4.9" },
  { name: "Trevor Guy", bugs: 35, projects: 5, avg: "4.7" },
  { name: "Ringo Star", bugs: 29, projects: 4, avg: "4.5" },
];

export default function StatsPage() {
  const { user } = useUser();
  if (!user || user.role !== "ADMIN") return <div className="px-6 py-6"><p className="text-gray-500">Acceso restringido.</p></div>;

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Estadísticas</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas generales de la plataforma</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Usuarios", value: 148 },
          { label: "Proyectos Activos", value: 23 },
          { label: "Bugs Resueltos", value: 289 },
          { label: "Tasa de Resolución", value: "92%" },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} />)}
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Bugs reportados por mes</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{d.bugs}</span>
                <div className="w-full rounded-t-md" style={{ height: `${(d.bugs / maxBugs) * 120}px`, backgroundColor: "#2d6a4f" }} />
                <span className="text-[10px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-56 bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Distribución de roles</h3>
          {[
            { label: "Testers", pct: 60, color: "#2d6a4f" },
            { label: "Emprendedores", pct: 37, color: "#e07b39" },
            { label: "Admins", pct: 3, color: "#9ca3af" },
          ].map((r) => (
            <div key={r.label} className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>{r.label}</span><span>{r.pct}%</span></div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Top Testers</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
              {["Tester", "Bugs", "Proyectos", "Reputación"].map(h => <th key={h} className="text-left pb-2 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {topTesters.map((t, i) => (
              <tr key={t.name} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">{i+1}.</span>
                    <div className="w-6 h-6 rounded-full bg-orange-300 flex items-center justify-center text-white text-[10px] font-bold">{t.name[0]}</div>
                    <span className="text-gray-700 text-xs font-medium">{t.name}</span>
                  </div>
                </td>
                <td className="py-2.5 text-gray-600 text-xs">{t.bugs}</td>
                <td className="py-2.5 text-gray-600 text-xs">{t.projects}</td>
                <td className="py-2.5 text-orange-500 text-xs font-medium">{t.avg} ★</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
