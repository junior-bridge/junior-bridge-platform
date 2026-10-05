"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useDashboardPostulationDetail } from "@/hooks/dashboard/useDashboardPostulationDetail";

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
};

const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
};

export default function PostulationDetailPage() {
    const params = useParams<{ id: string }>();
    const { user } = useUser();
    const id = Number(params.id);
    const {
        postulation,
        loading,
        actionLoading,
        error,
        handleStatusChange,
    } = useDashboardPostulationDetail(id);

    if (!user) return null;

    const backHref =
        user.role === "TESTER"
            ? "/dashboard/projects"
            : "/dashboard/postulations";

    if (loading) {
        return (
            <p className="px-4 sm:px-6 py-8 text-center text-sm text-gray-400">
                Cargando postulación...
            </p>
        );
    }

    if (error || !postulation) {
        return (
            <div className="px-4 sm:px-6 py-6">
                <Link
                    href={backHref}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-green hover:underline"
                >
                    <ArrowLeft size={16} /> Volver
                </Link>
                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                    <p className="text-sm text-red-600">
                        {error || "No se encontró la postulación."}
                    </p>
                </div>
            </div>
        );
    }

    const reputation = Number(postulation.tester_reputation ?? 0);

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
            <Link
                href={backHref}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-green hover:underline"
            >
                <ArrowLeft size={16} /> Volver
            </Link>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Detalle de postulación
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Información del proyecto y del tester postulado
                    </p>
                </div>
                <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusColors[postulation.status]}`}
                >
                    {statusLabels[postulation.status]}
                </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="mb-4 font-bold text-gray-800">Proyecto</h2>
                    <p className="text-sm font-medium text-gray-700">
                        {postulation.project_title ??
                            `Proyecto #${postulation.id_project}`}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Identificador: #{postulation.id_project}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="mb-4 font-bold text-gray-800">Tester</h2>
                    <p className="text-sm font-medium text-gray-700">
                        {postulation.tester_name ??
                            `Tester #${postulation.id_tester}`}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        {postulation.tester_email}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                fill={
                                    star <= Math.round(reputation)
                                        ? "#f97316"
                                        : "none"
                                }
                                stroke={
                                    star <= Math.round(reputation)
                                        ? "#f97316"
                                        : "#d1d5db"
                                }
                            />
                        ))}
                        <span className="ml-1 text-xs text-gray-500">
                            {reputation > 0 ? reputation.toFixed(1) : "Sin calificaciones"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-gray-800">Información</h2>
                <p className="text-sm text-gray-600">
                    Fecha de postulación:{" "}
                    <strong>
                        {new Date(
                            postulation.postulation_date,
                        ).toLocaleDateString("es-AR")}
                    </strong>
                </p>

                {user.role === "CLIENT" &&
                    postulation.status === "pending" && (
                        <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
                            <button
                                onClick={() => handleStatusChange("accept")}
                                disabled={actionLoading}
                                className="btn-green-sm disabled:opacity-60"
                            >
                                Aceptar
                            </button>
                            <button
                                onClick={() => handleStatusChange("reject")}
                                disabled={actionLoading}
                                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 disabled:opacity-60"
                            >
                                Rechazar
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
}
