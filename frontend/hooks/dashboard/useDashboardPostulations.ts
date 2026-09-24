import { acceptPostulation, getProjectPostulations, getUserPostulations, rejectPostulation } from "@/services/postulation.service";
import { getUserProjects } from "@/services/project.service";
import { User } from "@/types";
import { Postulation } from "@/types/postulationTypes";
import { useState, useEffect } from "react";

export const useDashboardPostulations = (user: User | null) => {
    
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
    return {
        statusColors,
        statusLabels,
        postulations,
        loading,
        actionLoading,
        handleAccept,
        handleReject,
    };
}