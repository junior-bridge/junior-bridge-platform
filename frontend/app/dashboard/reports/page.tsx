"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { Plus, X, Upload } from "lucide-react";
import {
    getPostulationReports,
    createReport,
    getUserPostulations,
    type Report,
    type Postulation,
} from "@/lib/api";

const riskColors: Record<string, string> = {
    ALTA: "bg-red-100 text-red-600",
    HIGH: "bg-red-100 text-red-600",
    MEDIA: "bg-yellow-100 text-yellow-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    BAJA: "bg-green-100 text-green-700",
    LOW: "bg-green-100 text-green-700",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-700",
    REVIEW: "bg-orange-100 text-orange-600",
    CLOSED: "bg-teal-100 text-teal-700",
};

const riskLabels: Record<string, string> = {
    HIGH: "ALTA",
    MEDIUM: "MEDIA",
    LOW: "BAJA",
    ALTA: "ALTA",
    MEDIA: "MEDIA",
    BAJA: "BAJA",
};

const statusLabels: Record<string, string> = {
    PENDING: "ABIERTO",
    REVIEW: "EN REVISIÓN",
    CLOSED: "RESUELTO",
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function ReportsPage() {
    const { user } = useUser();

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [userPostulations, setUserPostulations] = useState<Postulation[]>([]);

    const [postulationId, setPostulationId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [riskLevel, setRiskLevel] = useState("MEDIUM");
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

    const loadReports = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);

            const postulations = await getUserPostulations();
            setUserPostulations(postulations);

            const reportsPromises = postulations.map((p) =>
                getPostulationReports(p.id_postulation).catch(() => []),
            );
            const reportsNested = await Promise.all(reportsPromises);

            setReports(reportsNested.flat());
        } catch (err) {
            console.error("Error cargando reportes:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar los reportes.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        if (!user) return;

        async function initFetch() {
            try {
                setError(null);
                const postulations = await getUserPostulations();

                if (!isMounted) return;
                setUserPostulations(postulations);

                const reportsPromises = postulations.map((p) =>
                    getPostulationReports(p.id_postulation).catch(() => []),
                );
                const reportsNested = await Promise.all(reportsPromises);

                if (!isMounted) return;
                setReports(reportsNested.flat());
            } catch (err) {
                if (!isMounted) return;
                console.error("Error cargando reportes:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar los reportes.",
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initFetch();

        return () => {
            isMounted = false;
        };
    }, [user]);
    async function handleCreateReport(e: React.FormEvent) {
        e.preventDefault();
        if (!postulationId || !title || !description) {
            setModalError("Por favor completa los campos obligatorios.");
            return;
        }

        try {
            setSubmitting(true);
            setModalError(null);

            await createReport(Number(postulationId), {
                title,
                description,
                risk_level: riskLevel,
                capture_evidence: evidenceFile ?? undefined,
            });

            setIsModalOpen(false);
            setTitle("");
            setDescription("");
            setPostulationId("");
            setEvidenceFile(null);
            setRiskLevel("MEDIUM");

            await loadReports();
        } catch (err) {
            console.error("Error al crear reporte:", err);
            const message = err instanceof Error ? err.message : "";

            if (message.includes("No Postulation matches")) {
                setModalError(
                    "La postulación elegida no existe o no tienes acceso a ella.",
                );
            } else {
                setModalError(message || "No se pudo crear el reporte.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (!user) {
        return null;
    }

    return (
        <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Reportes
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {user.role === "CLIENT" &&
                            "Bugs reportados en tus proyectos"}
                        {user.role === "TESTER" &&
                            "Tus reportes de bugs enviados"}
                        {user.role === "ADMIN" &&
                            "Todos los reportes de la plataforma"}
                    </p>
                </div>

                {user.role === "TESTER" && (
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#e07b39" }}
                    >
                        <Plus size={15} />
                        Nuevo Reporte
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <p className="text-sm text-gray-500">
                        Cargando reportes...
                    </p>
                </div>
            )}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-4 py-3 font-semibold">
                                        ID
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Postulación
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Título
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Descripción
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Riesgo
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Estado
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => {
                                    const risk =
                                        riskLabels[report.risk_level] ??
                                        report.risk_level;
                                    const status =
                                        statusLabels[report.state] ??
                                        report.state;

                                    return (
                                        <tr
                                            key={report.id_report}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="px-4 py-3 text-gray-500 font-medium text-xs">
                                                #BUG-{report.id_report}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-xs">
                                                #{report.id_postulation}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 text-xs font-medium">
                                                {report.title}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-xs max-w-xs">
                                                <div className="truncate max-w-xs">
                                                    {report.description}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        riskColors[
                                                            report.risk_level
                                                        ] ??
                                                        "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {risk}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        statusColors[
                                                            report.state
                                                        ] ??
                                                        "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                                {formatDate(report.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {reports.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-sm text-gray-400">
                                No hay reportes para mostrar.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>

                        <h2 className="text-lg font-bold text-gray-800 mb-4">
                            Crear Nuevo Reporte de Bug
                        </h2>

                        {modalError && (
                            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600">
                                {modalError}
                            </div>
                        )}

                        <form
                            onSubmit={handleCreateReport}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Postulación / Proyecto *
                                </label>
                                <select
                                    required
                                    value={postulationId}
                                    onChange={(e) =>
                                        setPostulationId(e.target.value)
                                    }
                                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-orange-500"
                                >
                                    <option value="">
                                        Selecciona una postulación...
                                    </option>
                                    {userPostulations.map((p) => (
                                        <option
                                            key={p.id_postulation}
                                            value={p.id_postulation}
                                        >
                                            #{p.id_postulation} -{" "}
                                            {p.project_title ??
                                                `Proyecto #${p.id_project}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Título del Bug *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ej: Botón de pago no responde"
                                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Nivel de Riesgo
                                </label>
                                <select
                                    value={riskLevel}
                                    onChange={(e) =>
                                        setRiskLevel(e.target.value)
                                    }
                                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-orange-500"
                                >
                                    <option value="LOW">Baja</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="HIGH">Alta</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Descripción Detallada *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe los pasos para reproducir la falla..."
                                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-orange-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Captura de Evidencia (Opcional)
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
                                        <Upload size={14} />
                                        Subir archivo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                setEvidenceFile(
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                    </label>
                                    <span className="text-xs text-gray-400 truncate max-w-45">
                                        {evidenceFile
                                            ? evidenceFile.name
                                            : "Sin archivo"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-full text-xs text-white font-semibold disabled:opacity-50"
                                    style={{ backgroundColor: "#e07b39" }}
                                >
                                    {submitting
                                        ? "Enviando..."
                                        : "Crear Reporte"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
