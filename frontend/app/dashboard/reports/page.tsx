"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "../../../context/UserContext";
import { Plus, X, Upload } from "lucide-react";
import {
    getPostulationReports,
    createReport,
    getUserPostulations,
    type Report,
    type Postulation,
} from "@/lib/api";

const severityColors: Record<string, string> = {
    high: "bg-red-100 text-red-600",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
};

const statusColors: Record<string, string> = {
    PENDING: "bg-blue-100 text-blue-700",
    REVIEW: "bg-orange-100 text-orange-600",
    CLOSED: "bg-teal-100 text-teal-700",
};

const severityLabels: Record<string, string> = {
    high: "ALTA",
    medium: "MEDIA",
    low: "BAJA",
};

const statusLabels: Record<string, string> = {
    PENDING: "ABIERTO",
    REVIEW: "EN REVISIÓN",
    CLOSED: "RESUELTO",
};

type ReportFormField =
    | "postulationId"
    | "title"
    | "description"
    | "stepsToReproduce";
type ReportFormErrors = Partial<Record<ReportFormField, string>>;

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
    const [formErrors, setFormErrors] = useState<ReportFormErrors>({});
    const [userPostulations, setUserPostulations] = useState<Postulation[]>([]);

    const [postulationId, setPostulationId] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [severity, setSeverity] = useState("medium");
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
        const nextErrors: ReportFormErrors = {};

        if (!postulationId) {
            nextErrors.postulationId = "Seleccioná una postulación.";
        }
        if (!title.trim()) {
            nextErrors.title = "El título del bug es obligatorio.";
        }
        if (!description.trim()) {
            nextErrors.description = "La descripción es obligatoria.";
        }
        if (!stepsToReproduce.trim()) {
            nextErrors.stepsToReproduce =
                "Los pasos para reproducir son obligatorios.";
        }

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        try {
            setSubmitting(true);
            setModalError(null);

            const steps = stepsToReproduce
                .split("\n")
                .map((step) => step.trim())
                .filter((step) => step.length > 0);
                
            await createReport(Number(postulationId), {
                title: title.trim(),
                description: description.trim(),
                severity: severity,
                steps_to_reproduce: steps,
                capture_evidence: evidenceFile ?? undefined,
            });

            setIsModalOpen(false);
            setTitle("");
            setDescription("");
            setStepsToReproduce("");
            setPostulationId("");
            setEvidenceFile(null);
            setSeverity("medium");
            setFormErrors({});

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
                                        Severidad
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
                                    const severityLabel =
                                        severityLabels[report.severity] ??
                                        report.severity;
                                    const status =
                                        statusLabels[report.state ?? "PENDING"] ??
                                        report.state;

                                    return (
                                        <tr
                                            key={report._id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <td className="px-4 py-3 text-gray-500 font-medium text-xs">
                                                #{report._id.slice(-8)}
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
                                                        severityColors[
                                                            report.severity
                                                        ] ??
                                                        "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {severityLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        statusColors[
                                                            report.state ??
                                                                "PENDING"
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
                                    onChange={(e) => {
                                        setPostulationId(e.target.value);
                                        setFormErrors((current) => ({
                                            ...current,
                                            postulationId: undefined,
                                        }));
                                    }}
                                    aria-invalid={Boolean(
                                        formErrors.postulationId
                                    )}
                                    aria-describedby={
                                        formErrors.postulationId
                                            ? "postulation-error"
                                            : undefined
                                    }
                                    className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:border-orange-500 ${formErrors.postulationId ? "border-red-400" : "border-gray-200"}`}
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
                                {formErrors.postulationId && (
                                    <p
                                        id="postulation-error"
                                        className="mt-1 text-xs text-red-500"
                                    >
                                        {formErrors.postulationId}
                                    </p>
                                )}
                                {!formErrors.postulationId && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Elegí el proyecto en el que encontraste
                                        el problema.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Título del Bug *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setFormErrors((current) => ({
                                            ...current,
                                            title: undefined,
                                        }));
                                    }}
                                    aria-invalid={Boolean(formErrors.title)}
                                    aria-describedby={
                                        formErrors.title
                                            ? "title-error"
                                            : undefined
                                    }
                                    placeholder="Ej: Botón de pago no responde"
                                    className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:border-orange-500 ${formErrors.title ? "border-red-400" : "border-gray-200"}`}
                                />
                                {formErrors.title && (
                                    <p
                                        id="title-error"
                                        className="mt-1 text-xs text-red-500"
                                    >
                                        {formErrors.title}
                                    </p>
                                )}
                                {!formErrors.title && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Resumí el problema en una frase
                                        concreta.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Severidad
                                </label>
                                <select
                                    value={severity}
                                    onChange={(e) => setSeverity(e.target.value)}
                                    className="w-full text-xs rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-orange-500"
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
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
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        setFormErrors((current) => ({
                                            ...current,
                                            description: undefined,
                                        }));
                                    }}
                                    aria-invalid={Boolean(
                                        formErrors.description
                                    )}
                                    aria-describedby={
                                        formErrors.description
                                            ? "description-error"
                                            : undefined
                                    }
                                    placeholder="Describe qué ocurrió, qué esperabas y cómo lo reproducimos..."
                                    className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:border-orange-500 resize-none ${formErrors.description ? "border-red-400" : "border-gray-200"}`}
                                />
                                {formErrors.description && (
                                    <p
                                        id="description-error"
                                        className="mt-1 text-xs text-red-500"
                                    >
                                        {formErrors.description}
                                    </p>
                                )}
                                {!formErrors.description && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Contá qué hiciste, qué esperabas y qué
                                        ocurrió.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Pasos para Reproducir *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={stepsToReproduce}
                                    onChange={(e) => {
                                        setStepsToReproduce(e.target.value);
                                        setFormErrors((current) => ({
                                            ...current,
                                            stepsToReproduce: undefined,
                                        }));
                                    }}
                                    aria-invalid={Boolean(
                                        formErrors.stepsToReproduce
                                    )}
                                    aria-describedby={
                                        formErrors.stepsToReproduce
                                            ? "steps-error"
                                            : undefined
                                    }
                                    placeholder="1. Entrar a dashboard&#10;2. Hacer clic en botón X&#10;3. Esperar respuesta"
                                    className={`w-full text-xs rounded-lg border px-3 py-2 outline-none focus:border-orange-500 resize-none ${formErrors.stepsToReproduce ? "border-red-400" : "border-gray-200"}`}
                                />
                                {formErrors.stepsToReproduce && (
                                    <p
                                        id="steps-error"
                                        className="mt-1 text-xs text-red-500"
                                    >
                                        {formErrors.stepsToReproduce}
                                    </p>
                                )}
                                {!formErrors.stepsToReproduce && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Numerá cada paso en una línea separada.
                                    </p>
                                )}
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