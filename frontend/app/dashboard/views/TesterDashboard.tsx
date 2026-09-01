"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import {
    getProjects,
    getUserPostulations,
    applyToProject,
    type Project,
    type Postulation,
} from "@/lib/api";
import { useUser } from "@/context/UserContext";

const stateColor: Record<string, string> = {
    OPEN: "bg-green-100 text-green-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_REVIEW: "bg-orange-100 text-orange-600",
    COMPLETED: "bg-teal-100 text-teal-700",
    PENDING: "bg-gray-100 text-gray-500",
    REJECTED: "bg-red-100 text-red-600",
};

function StarDisplay({ stars }: { stars: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={12}
                    fill={i <= stars ? "#f97316" : "none"}
                    stroke={i <= stars ? "#f97316" : "#d1d5db"}
                />
            ))}
        </div>
    );
}

interface Props {
    userName: string;
}

export default function TesterDashboard({ userName }: Props) {
    const router = useRouter();
    const { user } = useUser();
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [myPostulations, setMyPostulations] = useState<Postulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<number | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [projs, posts] = await Promise.all([
                    getProjects(),
                    getUserPostulations(),
                ]);
                setAvailableProjects(
                    projs.filter(
                        (p) => p.state === "OPEN" || p.state === "IN_PROGRESS",
                    ),
                );
                setMyPostulations(posts);
            } catch {
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const activePostulations = myPostulations.filter(
        (p) => p.status === "accepted",
    );
    const pendingPostulations = myPostulations.filter(
        (p) => p.status === "pending",
    );

    const stats = [
        {
            label: "Proyectos Completados",
            value: myPostulations.filter((p) => p.status === "accepted").length,
        },
        { label: "Bugs Reportados", value: "—" },
        {
            label: "Reputación",
            value: user?.reputation ? `${user.reputation} ★` : "—",
        },
        { label: "Postulaciones Activas", value: pendingPostulations.length },
    ];

    const appliedProjectIds = new Set(myPostulations.map((p) => p.id_project));

    async function handleApply(projectId: number) {
        setApplying(projectId);
        try {
            const newPost = await applyToProject(projectId);
            setMyPostulations((prev) => [...prev, newPost]);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Error al postularse");
        } finally {
            setApplying(null);
        }
    }

    return (
        <main className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Hola, {userName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {loading
                        ? "Cargando tu información..."
                        : `Tenés ${activePostulations.length} proyecto${activePostulations.length !== 1 ? "s" : ""} activo${activePostulations.length !== 1 ? "s" : ""} y ${availableProjects.length} disponible${availableProjects.length !== 1 ? "s" : ""} para postularte.`}
                </p>
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
                    {activePostulations.length > 0 && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <h2 className="font-bold text-gray-800 mb-4">
                                Proyectos Activos
                            </h2>
                            <div className="flex flex-col gap-3">
                                {activePostulations.map((post) => {
                                    const proj = availableProjects.find(
                                        (p) => p.id === post.id_project,
                                    );
                                    return (
                                        <div
                                            key={post.id_postulation}
                                            className="border border-gray-100 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {proj?.title ??
                                                            `Proyecto #${post.id_project}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {proj?.description ??
                                                            ""}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                    EN CURSO
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        "/dashboard/reports",
                                                    )
                                                }
                                                className="mt-2 w-full rounded-lg py-1.5 text-white text-xs font-semibold hover:opacity-90 transition"
                                                style={{
                                                    backgroundColor: "#e07b39",
                                                }}
                                            >
                                                Reportar Bug
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-800">
                                Proyectos Disponibles
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
                            <p className="text-sm text-gray-400 text-center py-4">
                                Cargando proyectos...
                            </p>
                        ) : availableProjects.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">
                                No hay proyectos disponibles ahora.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {availableProjects.slice(0, 4).map((p) => {
                                    const alreadyApplied =
                                        appliedProjectIds.has(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            className="border border-gray-100 rounded-lg p-3 flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {p.title}
                                                    </p>
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stateColor[p.state]}`}
                                                    >
                                                        {p.state}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-1 line-clamp-1">
                                                    {p.description}
                                                </p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {p.technologies
                                                        .split(",")
                                                        .slice(0, 3)
                                                        .map((t) => (
                                                            <span
                                                                key={t}
                                                                className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"
                                                            >
                                                                {t.trim()}
                                                            </span>
                                                        ))}
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 capitalize">
                                                    {p.modality.toLowerCase()}
                                                </p>
                                            </div>
                                            {alreadyApplied ? (
                                                <span className="ml-4 shrink-0 text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                                                    Postulado
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        handleApply(p.id)
                                                    }
                                                    disabled={applying === p.id}
                                                    className="ml-4 shrink-0 rounded-lg px-3 py-1.5 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-60"
                                                    style={{
                                                        backgroundColor:
                                                            "#2d6a4f",
                                                    }}
                                                >
                                                    {applying === p.id
                                                        ? "..."
                                                        : "Postularme"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-56 bg-white rounded-xl p-4 shadow-sm">
                    <h2 className="font-bold text-gray-800 mb-1">
                        Mi Reputación
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl font-bold text-gray-800">
                            {user?.reputation ?? "0"}
                        </span>
                        <div>
                            <StarDisplay
                                stars={Math.round(
                                    Number(user?.reputation ?? 0),
                                )}
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {myPostulations.length} postulaciones
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-4">
                        Las calificaciones aparecerán aquí una vez que completes
                        proyectos.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard/reputation")}
                        className="mt-3 w-full text-xs text-[#2d6a4f] font-medium hover:underline"
                    >
                        Ver historial completo
                    </button>
                </div>
            </div>
        </main>
    );
}
