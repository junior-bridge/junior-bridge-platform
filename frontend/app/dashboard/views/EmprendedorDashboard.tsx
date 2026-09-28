"use client";
import { ChevronRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import ProjectItem from "@/components/dashboard/ProjectItem";
import PostulationCard from "@/components/dashboard/PostulationCard";

import { useDashboardEmprendedorView } from "@/hooks/dashboard/views/useDashboardEmprendedorView";

interface Props {
    userName: string;
}

export default function EmprendedorDashboard({ userName }: Props) {
    
    const{
        stateColor,
        stateProgress,
        router,
        projects,
        postulations,
        reports,
        loading,
        activeCount,
        pendingPostulations,
        stats
    }=useDashboardEmprendedorView();
    return (
        <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Hola, {userName}
                    </h1>

                    <p className="text-gray-500 text-sm mt-1">
                        {loading
                            ? "Cargando tu información..."
                            : `Tenés ${activeCount} proyecto${
                                  activeCount !== 1 ? "s" : ""
                              } activo${
                                  activeCount !== 1 ? "s" : ""
                              } y ${pendingPostulations} postulacion${
                                  pendingPostulations !== 1 ? "es" : ""
                              } nueva${
                                  pendingPostulations !== 1 ? "s" : ""
                              } hoy.`}
                    </p>
                </div>

                <button
                    onClick={() => router.push("/dashboard/projects/new")}
                    className="rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: "#e07b39" }}
                >
                    Publicar proyecto
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                    />
                ))}
            </div>

            <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800">
                                Mis Proyectos
                            </h2>

                            <button
                                onClick={() =>
                                    router.push("/dashboard/projects")
                                }
                                className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
                            >
                                Ver Todo <ChevronRight size={12} />
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-400 py-4 text-center">
                                Cargando proyectos...
                            </p>
                        ) : projects.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">
                                No tenés proyectos publicados todavía.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {projects.slice(0, 3).map((p) => (
                                    <ProjectItem
                                        key={p.id}
                                        name={p.title}
                                        description={p.technologies}
                                        status={p.state}
                                        progress={stateProgress[p.state] ?? 0}
                                        statusColor={
                                            stateColor[p.state] ??
                                            "bg-gray-100 text-gray-500"
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800">
                                Reportes recientes
                            </h2>

                            {reports.length > 0 && (
                                <button
                                    onClick={() =>
                                        router.push("/dashboard/reports")
                                    }
                                    className="text-xs text-[#2d6a4f] font-medium hover:underline flex items-center gap-1"
                                >
                                    Ver Todo <ChevronRight size={12} />
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-400 py-4 text-center">
                                Cargando reportes...
                            </p>
                        ) : reports.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">
                                No tenés reportes recibidos todavía.
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y">
                                {reports.slice(0, 3).map((report) => (
                                    <div
                                        key={report.id_report}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-800 truncate">
                                                    {report.title}
                                                </h3>

                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {report.description}
                                                </p>

                                                <p className="text-[11px] text-gray-400 mt-2">
                                                    {new Date(
                                                        report.created_at,
                                                    ).toLocaleDateString(
                                                        "es-AR",
                                                        {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                                                    report.state === "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : report.state ===
                                                            "REVIEW"
                                                          ? "bg-orange-100 text-orange-700"
                                                          : "bg-green-100 text-green-700"
                                                }`}
                                            >
                                                {report.state === "PENDING"
                                                    ? "Pendiente"
                                                    : report.state === "REVIEW"
                                                      ? "En revisión"
                                                      : "Cerrado"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-52 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800">
                            Postulaciones
                        </h2>

                        {postulations.length > 0 && (
                            <button
                                onClick={() =>
                                    router.push("/dashboard/postulations")
                                }
                                className="text-xs text-[#2d6a4f] font-medium hover:underline"
                            >
                                Ver
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-xs text-gray-400 text-center">
                            Cargando...
                        </p>
                    ) : postulations.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center">
                            Sin postulaciones aún.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {postulations.slice(0, 3).map((p) => (
                                <PostulationCard
                                    key={p.id_postulation}
                                    name={
                                        p.tester_name ??
                                        `Tester #${p.id_tester}`
                                    }
                                    role="Tester"
                                    stars={
                                        p.tester_reputation
                                            ? Math.round(
                                                  Number(p.tester_reputation),
                                              )
                                            : 0
                                    }
                                    onView={() =>
                                        router.push(
                                            `/dashboard/postulations/${p.id_postulation}`,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
