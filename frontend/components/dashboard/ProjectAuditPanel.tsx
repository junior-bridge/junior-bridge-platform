import { ProjectAuditState } from "@/hooks/dashboard/useProjectAudit";
import { AuditStrategy, ProjectAudit } from "@/types/projectTypes";
import { AlertTriangle, ChevronDown, ChevronUp, Gauge, Loader2 } from "lucide-react";

interface ProjectAuditPanelProps {
    state: ProjectAuditState;
    canRun: boolean;
    onToggle: () => void;
    onRun: () => void;
    onStrategyChange: (strategy: AuditStrategy) => void;
}

const SCORE_LABELS: { key: keyof Pick<ProjectAudit, "performance" | "accessibility" | "best_practices" | "seo">; label: string }[] = [
    { key: "performance", label: "Rendimiento" },
    { key: "accessibility", label: "Accesibilidad" },
    { key: "best_practices", label: "Buenas prácticas" },
    { key: "seo", label: "SEO" },
];

const STRATEGY_LABELS: Record<AuditStrategy, string> = {
    MOBILE: "Móvil",
    DESKTOP: "Escritorio",
};

function scoreColor(score: number | null): string {
    if (score === null) return "bg-gray-100 text-gray-400";
    if (score >= 90) return "bg-green-100 text-green-700";
    if (score >= 50) return "bg-orange-100 text-orange-600";
    return "bg-red-100 text-red-600";
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function AuditResult({ audit }: { audit: ProjectAudit }) {
    if (audit.status === "FAILED") {
        return (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">La última auditoría falló</p>
                    <p className="mt-0.5">
                        {audit.error_message || "No se pudo obtener el resultado."}
                    </p>
                    <p className="mt-1 text-[10px] text-red-400">
                        {STRATEGY_LABELS[audit.strategy]} · {formatDate(audit.created_at)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCORE_LABELS.map(({ key, label }) => {
                    const score = audit[key];
                    return (
                        <div
                            key={key}
                            className="flex flex-col items-center gap-1 rounded-lg border border-gray-100 p-2"
                        >
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${scoreColor(score)}`}
                            >
                                {score ?? "–"}
                            </span>
                            <span className="text-[10px] text-gray-500 text-center">
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <p className="mt-2 text-[10px] text-gray-400">
                {STRATEGY_LABELS[audit.strategy]} · {formatDate(audit.created_at)}
            </p>
        </div>
    );
}

export default function ProjectAuditPanel({
    state,
    canRun,
    onToggle,
    onRun,
    onStrategyChange,
}: ProjectAuditPanelProps) {
    const { isOpen, loading, running, audit, strategy, error } = state;

    return (
        <div className="mt-3 pt-3 border-t border-gray-50">
            <button
                type="button"
                onClick={onToggle}
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
            >
                <Gauge size={14} />
                {isOpen ? "Ocultar auditoría" : "Ver auditoría"}
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="mt-3 flex flex-col gap-3">
                    {loading ? (
                        <p className="text-xs text-gray-400">Cargando auditoría...</p>
                    ) : running ? (
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                            <Loader2 size={14} className="animate-spin" />
                            Analizando... puede tardar hasta un minuto
                        </p>
                    ) : audit ? (
                        <AuditResult audit={audit} />
                    ) : (
                        !error && (
                            <p className="text-xs text-gray-400">
                                Todavía no hay auditorías
                            </p>
                        )
                    )}

                    {error && <p className="text-xs text-red-600">{error}</p>}

                    {canRun && (
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={strategy}
                                onChange={(e) =>
                                    onStrategyChange(e.target.value as AuditStrategy)
                                }
                                disabled={running}
                                aria-label="Dispositivo de la auditoría"
                                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 outline-none focus:border-teal-500"
                            >
                                {Object.entries(STRATEGY_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={onRun}
                                disabled={running || loading}
                                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {running ? "Analizando..." : "Ejecutar auditoría"}
                            </button>
                        </div>
                    )}

                    <p className="text-[10px] text-gray-400">
                        Datos de Google PageSpeed Insights
                    </p>
                </div>
            )}
        </div>
    );
}
