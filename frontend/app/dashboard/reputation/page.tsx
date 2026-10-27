"use client";

import { Star } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useReputation } from "@/hooks/dashboard/useReputation";
import Loader from "@/components/ui/Loader";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    fill={i <= value ? "#f97316" : "none"}
                    stroke={i <= value ? "#f97316" : "#d1d5db"}
                />
            ))}
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-600 font-semibold tracking-wide uppercase mb-2">
                {label}
            </p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function ReputationPage() {
    const { user } = useUser();
    const { reputation, loading, error } = useReputation();

    if (!user || user.role !== "TESTER") {
        return (
            <div className="px-4 sm:px-6 py-4 sm:py-6">
                <p className="text-gray-600">
                    Esta sección es solo para testers.
                </p>
            </div>
        );
    }

    const ratings = reputation?.ratings ?? [];
    const average = reputation?.reputation ?? 0;
    const totalRatings = reputation?.total_ratings ?? 0;
    const maxStars = ratings.length
        ? Math.max(...ratings.map((r) => r.stars))
        : 0;
    const minStars = ratings.length
        ? Math.min(...ratings.map((r) => r.stars))
        : 0;

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Mi Reputación
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                    Tu historial de calificaciones como tester
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader
                        size={40}
                        color="#98410f"
                        label="Cargando tu reputación..."
                    />
                </div>
            ) : error ? (
                <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                    <p className="text-gray-600">
                        No se pudo cargar tu reputación. Intentá nuevamente.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <SummaryCard
                            label="Promedio General"
                            value={
                                average > 0 ? `${average.toFixed(1)} ★` : "—"
                            }
                        />
                        <SummaryCard
                            label="Calificaciones Recibidas"
                            value={String(totalRatings)}
                        />
                        <SummaryCard
                            label="Calificación Más Alta"
                            value={maxStars > 0 ? `${maxStars} ★` : "—"}
                        />
                        <SummaryCard
                            label="Calificación Más Baja"
                            value={minStars > 0 ? `${minStars} ★` : "—"}
                        />
                    </div>

                    {ratings.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                            <p className="text-gray-600">
                                Todavía no tenés calificaciones. Completá
                                proyectos para que los emprendedores te
                                califiquen.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {ratings.map((r) => (
                                <div
                                    key={r.id_rating}
                                    className="bg-white rounded-xl p-5 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800">
                                                {r.project_title}
                                            </h3>
                                            <p className="text-xs text-gray-600">
                                                por {r.entrepreneur_name} ·{" "}
                                                {formatDate(r.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Stars value={r.stars} />
                                            <span className="text-sm font-bold text-gray-700 ml-1">
                                                {r.stars}.0
                                            </span>
                                        </div>
                                    </div>

                                    {r.comment && (
                                        <p className="text-xs text-gray-600 italic border-t border-gray-50 pt-2">
                                            “{r.comment}”
                                        </p>
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
