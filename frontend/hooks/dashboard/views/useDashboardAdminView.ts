import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types/projectTypes";
import { getProjects } from "@/services/project.service";

export const useDashboardAdminView = () => {
    const stateColor: Record<string, string> = {
        PENDING: "bg-gray-100 text-gray-500",
        OPEN: "bg-blue-100 text-blue-700",
        IN_PROGRESS: "bg-green-100 text-green-700",
        IN_REVIEW: "bg-orange-100 text-orange-600",
        COMPLETED: "bg-teal-100 text-teal-700",
        REJECTED: "bg-red-100 text-red-600",
    };

    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProjects()
            .then(setProjects)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

     const stats = [
        { label: "Usuarios Registrados", value: "—" },
        {
            label: "Proyectos Activos",
            value: projects.filter(
                (p) => p.state === "OPEN" || p.state === "IN_PROGRESS",
            ).length,
        },
        { label: "Bugs Reportados", value: "—" },
        { label: "Proyectos Totales", value: projects.length },
    ];

    return {
        stateColor,
        router,
        projects,
        loading,
        stats
    }
}