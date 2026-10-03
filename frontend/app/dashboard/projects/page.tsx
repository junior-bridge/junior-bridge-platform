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
        postulationsByProject,
        filteredProjects,
        postulationToWithdraw,
        setPostulationToWithdraw,
        withdrawingId,
        handleWithdraw,
        message,
        messageError,
    } = useDashboardProjects({ user, isClient, isTester, isAdmin });

    if (!user) return null;

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
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
                        className="flex items-center gap-2 btn-primary"
                        
                    >
                        <Plus size={15} /> Nuevo Proyecto
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-full sm:w-72 border border-gray-200 mb-6">
                <Search size={15} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar proyecto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                />
            </div>

            {message && (
                <p
                    className={`text-sm mb-4 ${messageError ? "text-red-600" : "text-brand-green"}`}
                >
                    {message}
                </p>
            )}

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
                                const postulation = postulationsByProject.get(p.id);
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
                                        {postulation ? (
                                            <div className="ml-4 shrink-0 flex flex-col items-end gap-2">
                                                <span
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                                                        postulation.status === "accepted"
                                                            ? "bg-green-100 text-green-700"
                                                            : postulation.status === "rejected"
                                                              ? "bg-red-100 text-red-600"
                                                              : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                    {postulation.status === "accepted"
                                                        ? "Postulación aceptada"
                                                        : postulation.status === "rejected"
                                                          ? "Postulación rechazada"
                                                          : "Postulación pendiente"}
                                                </span>
                                                {postulation.status === "pending" && (
                                                    <button
                                                        onClick={() =>
                                                            setPostulationToWithdraw(
                                                                postulation,
                                                            )
                                                        }
                                                        className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                                                    >
                                                        Retirar postulación
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleApply(p.id)}
                                                disabled={
                                                    p.state !== "OPEN" ||
                                                    applyingId === p.id
                                                }
                                                className={
                                                    p.state === "OPEN"
                                                        ? "ml-4 shrink-0 btn-green-sm disabled:opacity-60"
                                                        : "ml-4 shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
                                                }
                                            >
                                                {applyingId === p.id
                                                    ? "Postulando..."
                                                    : "Postularme"}
                                            </button>
                                        )}
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
                                                            onClick={() => handleStatusChange(p.id, "OPEN")}
                                                            className="text-[10px] font-semibold px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(p.id, "REJECTED")}
                                                            className="text-[10px] font-semibold px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
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

            {postulationToWithdraw && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-800">
                            Retirar postulación
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            ¿Confirmás que querés retirar tu postulación? Esta
                            acción no se puede deshacer.
                        </p>
                        {message && messageError && (
                            <p className="mt-3 text-sm text-red-600">
                                {message}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setPostulationToWithdraw(null)}
                                disabled={withdrawingId !== null}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawingId !== null}
                                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {withdrawingId !== null
                                    ? "Retirando..."
                                    : "Retirar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
