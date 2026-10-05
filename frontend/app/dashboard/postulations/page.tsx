"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Star } from "lucide-react";
import {
    getUserProjects,
    getProjectPostulations,
    getUserPostulations,
    acceptPostulation,
    rejectPostulation,
    type Postulation,
} from "@/lib/api";

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
};

const statusLabels: Record<string, string> = {
    pending: "PENDIENTE",
    accepted: "ACEPTADO",
    rejected: "RECHAZADO",
};

export default function PostulationsPage() {
    const { user } = useUser();
    const [postulations, setPostulations] = useState<Postulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        async function loadPostulations() {
            if (!user) return;
            try {
                if (user.role === "CLIENT") {
                    const projs = await getUserProjects();
                    const postsPromises = projs.map((p) =>
                        getProjectPostulations(p.id).catch(() => []),
                    );
                    const results = await Promise.all(postsPromises);
                    setPostulations(results.flat());
                } else if (user.role === "TESTER") {
                    const posts = await getUserPostulations();
                    setPostulations(posts);
                }
            } catch {
            } finally {
                setLoading(false);
            }
        }

        loadPostulations();
    }, [user]);

    if (!user) return null;

    async function handleAccept(id: number) {
        setActionLoading(id);
        try {
            const updated = await acceptPostulation(id);
            setPostulations((prev) =>
                prev.map((p) =>
                    p.id_postulation === id
                        ? { ...p, status: updated.status }
                        : p,
                ),
            );
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Error al aceptar postulación.",
            );
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(id: number) {
        setActionLoading(id);
        try {
            const updated = await rejectPostulation(id);
            setPostulations((prev) =>
                prev.map((p) =>
                    p.id_postulation === id
                        ? { ...p, status: updated.status }
                        : p,
                ),
            );
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Error al rechazar postulación.",
            );
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="px-6 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Postulaciones
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {user.role === "CLIENT"
                        ? "Testers que se postularon a tus proyectos"
                        : "Tus postulaciones a proyectos"}
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                    Cargando postulaciones...
                </p>
            ) : postulations.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <p className="text-sm text-gray-400">
                        No hay postulaciones registradas.
                    </p>
                </div>
            ) : (
                <>
                    {user.role === "CLIENT" && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                        {[
                                            "Tester",
                                            "Proyecto",
                                            "Reputación",
                                            "Fecha",
                                            "Estado",
                                            "Acción",
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
                                    {postulations.map((p) => {
                                        const testerInitial = (p.tester_name ??
                                            "T")[0].toUpperCase();
                                        const repNumber = p.tester_reputation
                                            ? Number(p.tester_reputation)
                                            : 0;
                                        return (
                                            <tr
                                                key={p.id_postulation}
                                                className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold">
                                                            {testerInitial}
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-700 font-medium text-xs">
                                                                {p.tester_name ??
                                                                    `Tester #${p.id_tester}`}
                                                            </p>
                                                            <p className="text-gray-400 text-[10px]">
                                                                {p.tester_email ??
                                                                    ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-xs">
                                                    {p.project_title ??
                                                        `Proyecto #${p.id_project}`}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map(
                                                            (i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={11}
                                                                    fill={
                                                                        i <=
                                                                        Math.round(
                                                                            repNumber,
                                                                        )
                                                                            ? "#f97316"
                                                                            : "none"
                                                                    }
                                                                    stroke={
                                                                        i <=
                                                                        Math.round(
                                                                            repNumber,
                                                                        )
                                                                            ? "#f97316"
                                                                            : "#d1d5db"
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                        <span className="text-xs text-gray-500 ml-1">
                                                            {repNumber > 0
                                                                ? repNumber.toFixed(
                                                                      1,
                                                                  )
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-400 text-xs">
                                                    {new Date(
                                                        p.postulation_date,
                                                    ).toLocaleDateString(
                                                        "es-AR",
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] ?? "bg-gray-100 text-gray-500"}`}
                                                    >
                                                        {statusLabels[
                                                            p.status
                                                        ] ?? p.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {p.status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleAccept(
                                                                        p.id_postulation,
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading ===
                                                                    p.id_postulation
                                                                }
                                                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-green-600 text-white hover:opacity-90 transition disabled:opacity-60"
                                                            >
                                                                {actionLoading ===
                                                                p.id_postulation
                                                                    ? "..."
                                                                    : "Aceptar"}
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleReject(
                                                                        p.id_postulation,
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading ===
                                                                    p.id_postulation
                                                                }
                                                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-red-100 text-red-600 hover:opacity-90 transition disabled:opacity-60"
                                                            >
                                                                {actionLoading ===
                                                                p.id_postulation
                                                                    ? "..."
                                                                    : "Rechazar"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {user.role === "TESTER" && (
                        <div className="flex flex-col gap-4">
                            {postulations.map((p) => (
                                <div
                                    key={p.id_postulation}
                                    className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800">
                                                {p.project_title ??
                                                    `Proyecto #${p.id_project}`}
                                            </h3>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status] ?? "bg-gray-100 text-gray-500"}`}
                                            >
                                                {statusLabels[p.status] ??
                                                    p.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Postulado:{" "}
                                            {new Date(
                                                p.postulation_date,
                                            ).toLocaleDateString("es-AR")}
                                        </p>
                                    </div>
                                    {p.status === "accepted" && (
                                        <span className="ml-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700">
                                            Aceptado para testing
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
