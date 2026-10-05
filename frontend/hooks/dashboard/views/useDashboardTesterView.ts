import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/projectTypes";
import { Postulation } from "@/types/postulationTypes";
import { getProjects } from "@/services/project.service";
import { applyToProject, getUserPostulations } from "@/services/postulation.service";
import { User } from "@/types";
import Swal from "sweetalert2";

export const useDashboardTesterView = (user: User | null) => {

    const stateColor: Record<string, string> = {
        OPEN: "bg-green-100 text-green-700",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        IN_REVIEW: "bg-orange-100 text-orange-600",
        COMPLETED: "bg-teal-100 text-teal-700",
        PENDING: "bg-gray-100 text-gray-500",
        REJECTED: "bg-red-100 text-red-600",
    };
    const router = useRouter();
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
            value: user?.reputation ? `${user?.reputation} ★` : "—",
        },
        { label: "Postulaciones Activas", value: pendingPostulations.length },
    ];

    const appliedProjectIds = new Set(myPostulations.map((p) => p.id_project));

    async function handleApply(projectId: number) {
        setApplying(projectId);
        try {
            const newPost = await applyToProject(projectId);
            setMyPostulations((prev) => [...prev, newPost]);
            await Swal.fire({
                title: "Postulación enviada",
                text: "Tu postulación se envió correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar",
            });
        } catch {
            await Swal.fire({
                title: "No se pudo enviar la postulación",
                text: "Ocurrió un error al enviar la postulación. Intentá nuevamente.",
                icon: "error",
                confirmButtonText: "Aceptar",
            });
        } finally {
            setApplying(null);
        }
    }

    return {
        stateColor,
        router,
        availableProjects,
        myPostulations,
        loading,
        applying,
        activePostulations,
        stats,
        appliedProjectIds,
        handleApply,
    }
}
