import { applyToProject, getUserPostulations } from "@/services/postulation.service";
import { getProjects, getUserProjects, updateProjectState } from "@/services/project.service";
import { User } from "@/types";
import { Postulation } from "@/types/postulationTypes";
import { Project, ProjectState } from "@/types/projectTypes";
import { useState, useEffect } from "react";

export const useDashboardProjects=({user,isClient,isTester,isAdmin}  :{ user: User | null; isClient: boolean; isTester: boolean; isAdmin: boolean })=>{

    const statusColors: Record<string, string> = {
        PENDING: "bg-gray-100 text-gray-500",
        OPEN: "bg-green-100 text-green-700",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        IN_REVIEW: "bg-orange-100 text-orange-600",
        COMPLETED: "bg-teal-100 text-teal-700",
        REJECTED: "bg-red-100 text-red-600",
    };
    
    const projectStateLabels: Record<ProjectState, string> = {
        PENDING: "Pendiente",
        OPEN: "Abierto",
        IN_PROGRESS: "En progreso",
        IN_REVIEW: "En revisión",
        COMPLETED: "Completado",
        REJECTED: "Rechazado",
    };
    const [projects, setProjects] = useState<Project[]>([]);
    const [postulations, setMyPostulations] = useState<Postulation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState<number | null>(null);
    
    useEffect(() => {
            async function loadData() {
                try {
                    if (isClient) {
                        const projs = await getUserProjects();
                        setProjects(projs);
                    } else if (isTester) {
                        const [projs, posts] = await Promise.all([
                            getProjects(),
                            getUserPostulations(),
                        ]);
                        setProjects(projs);
                        setMyPostulations(posts);
                    } else if (isAdmin) {
                        const projs = await getProjects();
                        setProjects(projs);
                    }
                } catch {
                } finally {
                    setLoading(false);
                }
            }
    
            if (user) {
                loadData();
            }
    }, [user, isClient, isTester, isAdmin]);
    
    const appliedProjectIds = new Set(postulations.map((p) => p.id_project));
    
    const filteredProjects = projects.filter(
            (p) =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.technologies.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    
    async function handleApply(projectId: number) {
            setApplyingId(projectId);
            try {
                const newPost = await applyToProject(projectId);
                setMyPostulations((prev) => [...prev, newPost]);
            } catch (err) {
                alert(err instanceof Error ? err.message : "Error al postularse.");
            } finally {
                setApplyingId(null);
            }
    }
    
    async function handleStatusChange(
            projectId: number,
            newState: Project["state"],
        ) {
            try {
                await updateProjectState(projectId, newState);
                setProjects((prev) =>
                    prev.map((p) =>
                        p.id === projectId ? { ...p, state: newState } : p,
                    ),
                );
            } catch (err) {
                alert(
                    err instanceof Error
                        ? err.message
                        : "Error al actualizar estado.",
                );
            }
    }
    return {
        statusColors,
        searchTerm,
        setSearchTerm,
        loading,
        applyingId,
        handleApply,
        handleStatusChange,
        appliedProjectIds,
        filteredProjects,
    }
}