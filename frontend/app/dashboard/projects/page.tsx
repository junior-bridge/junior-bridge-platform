"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { Plus, Search } from "lucide-react";
import { useDashboardProjects } from "@/hooks/dashboard/useDashboardProjects";



export default function ProjectsPage() {
    const { user, isClient, isTester, isAdmin } = useUser();
    const {
        statusColors,
        searchTerm,
        setSearchTerm,
        loading,
        applyingId,
        handleApply,
        handleStatusChange,
        appliedProjectIds,
        filteredProjects
    }=useDashboardProjects({user,isClient,isTester,isAdmin});

    if (!user) return null;

    return (
        <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Proyectos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isClient && "Gestioná tus proyectos publicados"}
                        {isTester && "Explorá proyectos disponibles"}
                        {isAdmin && "Todos los proyectos de la plataforma"}
                    </p>
                </div>
                {isClient && (
                    <Link
                        href="/dashboard/projects/new"
                        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition"
                        style={{ backgroundColor: "#e07b39" }}
                    >
                        <Plus size={15} /> Nuevo Proyecto
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 border border-gray-200 mb-6">
                <Search size={15} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar proyecto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                />
            </div>

            {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                    Cargando proyectos...
                </p>
            ) : filteredProjects.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <p className="text-sm text-gray-400">
                        No se encontraron proyectos.
                    </p>
                </div>
            ) : (
                <>
                    {isClient && (
                        <div className="flex flex-col gap-4">
                            {filteredProjects.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-xl p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800">
                                                    {p.title}
                                                </h3>
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.state] ?? "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {p.state}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {p.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap mb-3">
                                        {p.technologies.split(",").map((t) => (
                                            <span
                                                key={t}
                                                className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"
                                            >
                                                {t.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-400 pt-2 border-t border-gray-50">
                                        <span>
                                            Modalidad:{" "}
                                            <strong className="text-gray-600">
                                                {p.modality}
                                            </strong>
                                        </span>
                                        <span>
                                            Creado:{" "}
                                            {new Date(
                                                p.created_at,
                                            ).toLocaleDateString("es-AR")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isTester && (
                        <div className="flex flex-col gap-4">
                            {filteredProjects.map((p) => {
                                const alreadyApplied = appliedProjectIds.has(
                                    p.id,
                                );
                                return (
                                    <div
                                        key={p.id}
                                        className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800">
                                                    {p.title}
                                                </h3>
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.state] ?? "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {p.state}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {p.description}
                                            </p>
                                            <div className="flex gap-1 flex-wrap">
                                                {p.technologies
                                                    .split(",")
                                                    .map((s) => (
                                                        <span
                                                            key={s}
                                                            className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"
                                                        >
                                                            {s.trim()}
                                                        </span>
                                                    ))}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 capitalize">
                                                Modalidad:{" "}
                                                {p.modality.toLowerCase()}
                                            </p>
                                        </div>
                                        {(p.state === "OPEN" ||
                                            p.state === "IN_PROGRESS") &&
                                            (alreadyApplied ? (
                                                <span className="ml-4 shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">
                                                    Ya postulado
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleApply(p.id)
                                                    }
                                                    disabled={
                                                        applyingId === p.id
                                                    }
                                                    className="ml-4 shrink-0 rounded-lg px-4 py-2 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-60"
                                                    style={{
                                                        backgroundColor:
                                                            "#2d6a4f",
                                                    }}
                                                >
                                                    {applyingId === p.id
                                                        ? "Postulando..."
                                                        : "Postularme"}
                                                </button>
                                            ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                        {[
                                            "ID",
                                            "Proyecto",
                                            "Modalidad",
                                            "Estado",
                                            "Creado",
                                            "Acciones",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="text-left px-4 py-3 font-semibold"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                #{p.id}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium text-xs">
                                                {p.title}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                                                {p.modality.toLowerCase()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.state] ?? "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {p.state}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {new Date(
                                                    p.created_at,
                                                ).toLocaleDateString("es-AR")}
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.state === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    p.id,
                                                                    "OPEN",
                                                                )
                                                            }
                                                            className="text-[10px] font-semibold px-2 py-1 rounded bg-green-600 text-white hover:opacity-90"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    p.id,
                                                                    "REJECTED",
                                                                )
                                                            }
                                                            className="text-[10px] font-semibold px-2 py-1 rounded bg-red-100 text-red-600 hover:opacity-90"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
