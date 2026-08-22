"use client";

import { useUser } from "@/context/UserContext";
import { Search, UserPlus } from "lucide-react";

const users = [
  { id: "USR-001", name: "Roxana Pop", email: "roxana@mail.com", role: "tester", status: "activo", joined: "01 Ago 2026", projects: 4, reputation: "4.9" },
  { id: "USR-002", name: "Martin Díaz", email: "martin@mail.com", role: "emprendedor", status: "activo", joined: "28 Jul 2026", projects: 3, reputation: "-" },
  { id: "USR-003", name: "Trevor Guy", email: "trevor@mail.com", role: "tester", status: "pendiente", joined: "06 Ago 2026", projects: 1, reputation: "4.2" },
  { id: "USR-004", name: "Laura Sosa", email: "laura@mail.com", role: "emprendedor", status: "activo", joined: "15 Jul 2026", projects: 2, reputation: "-" },
  { id: "USR-005", name: "Ringo Star", email: "ringo@mail.com", role: "tester", status: "activo", joined: "10 Jun 2026", projects: 8, reputation: "4.5" },
];

const roleColors: Record<string, string> = { tester: "bg-blue-100 text-blue-700", emprendedor: "bg-orange-100 text-orange-700" };
const statusColors: Record<string, string> = { activo: "bg-green-100 text-green-700", pendiente: "bg-yellow-100 text-yellow-700", suspendido: "bg-red-100 text-red-600" };

export default function UsersPage() {
  const { user } = useUser();
  if (!user || user.role !== "ADMIN") return <div className="px-6 py-6"><p className="text-gray-500">Acceso restringido.</p></div>;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <button className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#e07b39" }}>
          <UserPlus size={15} /> Invitar usuario
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-64 border border-gray-200">
          <Search size={14} className="text-gray-400" />
          <input type="text" placeholder="Buscar usuario..." className="bg-transparent text-sm outline-none w-full placeholder-gray-400" />
        </div>
        {["Todos", "Testers", "Emprendedores"].map((f) => (
          <button key={f} className={`px-4 py-2 rounded-full text-xs font-medium border transition ${f === "Todos" ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"}`}>{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              {["Usuario", "Rol", "Estado", "Registro", "Proyectos", "Reputación", "Acciones"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                    <div>
                      <p className="text-gray-700 font-medium text-xs">{u.name}</p>
                      <p className="text-gray-400 text-[10px]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{u.role}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[u.status]}`}>{u.status}</span></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{u.joined}</td>
                <td className="px-4 py-3 text-gray-600 text-center text-xs">{u.projects}</td>
                <td className="px-4 py-3 text-orange-500 text-xs font-medium">{u.reputation !== "-" ? `${u.reputation} ★` : "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-[10px] px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium">Ver</button>
                    <button className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium">Suspender</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
