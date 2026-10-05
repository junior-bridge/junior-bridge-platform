"use client";

import { ChevronRight, Users, FolderOpen, Bug, Star } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { useDashboardAdminView } from "@/hooks/dashboard/views/useDashboardAdminView";

interface Props {
    userName: string;
}

export default function AdminDashboard({ userName }: Props) {
    const {
        stateColor,
        router,
        projects,
        users,
        loading,
        stats,
    } = useDashboardAdminView();

    return (
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Hola, {userName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Resumen general de la plataforma JuniorBridge.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                    />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <FolderOpen
                                    size={16}
                                    className="text-brand-green"
                                />{" "}
                                Proyectos Recientes
                            </h2>

                            <button
                                onClick={() =>
                                    router.push("/dashboard/projects")
                                }
                                className="text-xs text-brand-green font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                Ver Todo <ChevronRight size={12} />
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                                Cargando...
                            </p>
                        ) : projects.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                                No hay proyectos registrados.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                        {[
                                            "Proyecto",
                                            "Modalidad",
                                            "Estado",
                                            "Creado",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left pb-2 font-semibold"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {projects.slice(0, 5).map((p) => (
                                        <tr
                                            key={p.id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    "/dashboard/projects",
                                                )
                                            }
                                        >
                                            <td className="py-2.5 text-gray-700 font-medium text-xs">
                                                {p.title}
                                            </td>

                                            <td className="py-2.5 text-gray-400 text-xs capitalize">
                                                {p.modality.toLowerCase()}
                                            </td>

                                            <td className="py-2.5">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateColor[p.state]}`}
                                                >
                                                    {p.state}
                                                </span>
                                            </td>

                                            <td className="py-2.5 text-gray-400 text-xs">
                                                {new Date(
                                                    p.created_at,
                                                ).toLocaleDateString("es-AR", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Users
                                    size={16}
                                    className="text-brand-green"
                                />{" "}
                                Usuarios Recientes
                            </h2>

                            <button
                                onClick={() =>
                                    router.push("/dashboard/users")
                                }
                                className="text-xs text-brand-green font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                Ver Todo <ChevronRight size={12} />
                            </button>
                        </div>

                        {users.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-2">
                                No hay usuarios registrados.
                            </p>
                        ) : (
                            <div className="flex flex-col">
                                {users.slice(0, 5).map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold uppercase">
                                                {u.name ? u.name[0] : "U"}
                                            </div>

                                            <div>
                                                <p className="text-gray-700 font-medium text-xs">
                                                    {u.name} {u.surname}
                                                </p>

                                                <p className="text-gray-400 text-[10px]">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                u.role === "TESTER"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : u.role === "CLIENT"
                                                      ? "bg-orange-100 text-orange-700"
                                                      : "bg-purple-100 text-purple-700"
                                            }`}
                                        >
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:w-52 flex flex-col gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Bug
                                size={15}
                                className="text-red-400"
                            />{" "}
                            Bugs Recientes
                        </h2>

                        <p className="text-xs text-gray-400 text-center py-2">
                            Disponible con{" "}
                            <code className="text-xs bg-gray-100 px-1 rounded">
                                /api/reports/
                            </code>
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Star
                                size={15}
                                className="text-orange-400"
                            />{" "}
                            Estado de Proyectos
                        </h2>

                        <div className="flex flex-col gap-2">
                            {Object.entries(
                                projects.reduce(
                                    (acc, p) => {
                                        acc[p.state] =
                                            (acc[p.state] ?? 0) + 1;
                                        return acc;
                                    },
                                    {} as Record<string, number>,
                                ),
                            ).map(([state, count]) => (
                                <div
                                    key={state}
                                    className="flex items-center justify-between"
                                >
                                    <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateColor[state]}`}
                                    >
                                        {state}
                                    </span>

                                    <span className="text-xs font-bold text-gray-700">
                                        {count}
                                    </span>
                                </div>
                            ))}

                            {projects.length === 0 && !loading && (
                                <p className="text-xs text-gray-400 text-center">
                                    Sin datos
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}