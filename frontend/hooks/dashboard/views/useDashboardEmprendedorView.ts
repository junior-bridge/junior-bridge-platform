import { getProjectPostulations } from "@/services/postulation.service";
import { getUserProjects } from "@/services/project.service";
import { getPostulationReports } from "@/services/report.service";
import { Postulation } from "@/types/postulationTypes";
import { Project } from "@/types/projectTypes";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";

export const useDashboardEmprendedorView = () => {
    const stateColor: Record<string, string> = {
        PENDING: "bg-gray-100 text-gray-500",
        OPEN: "bg-blue-100 text-blue-700",
        IN_PROGRESS: "bg-green-100 text-green-700",
        IN_REVIEW: "bg-orange-100 text-orange-600",
        COMPLETED: "bg-teal-100 text-teal-700",
        REJECTED: "bg-red-100 text-red-600",
    };
    
    const stateProgress: Record<string, number> = {
        PENDING: 10,
        OPEN: 25,
        IN_PROGRESS: 60,
        IN_REVIEW: 85,
        COMPLETED: 100,
        REJECTED: 0,
    };
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [postulations, setPostulations] = useState<Postulation[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const projs = await getUserProjects();
                setProjects(projs);

                const postsPromises = projs.map((project) =>
                    getProjectPostulations(project.id).catch(() => []),
                );

                const results = await Promise.all(postsPromises);

                const allPosts = results
                    .flat()
                    .sort(
                        (a, b) =>
                            new Date(b.postulation_date).getTime() -
                            new Date(a.postulation_date).getTime(),
                    );

                setPostulations(allPosts);

                const reportsPromises = allPosts.map((postulation) =>
                    getPostulationReports(postulation.id_postulation).catch(
                        () => [],
                    ),
                );

                const reportResults = await Promise.all(reportsPromises);
                const allReports = reportResults.flat();

                allReports.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                );

                setReports(allReports);
            } catch (error) {
                console.error("Error cargando dashboard:", error);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    const activeCount = projects.filter(
        (p) => p.state === "IN_PROGRESS" || p.state === "OPEN",
    ).length;

    const pendingPostulations = postulations.filter(
        (p) => p.status === "pending",
    ).length;
    const stats = [
        {
            label: "Proyectos Publicados",
            value: projects.length,
        },
        {
            label: "Postulaciones Nuevas",
            value: pendingPostulations,
        },
        {
            label: "Reportes Recibidos",
            value: reports.length,
        },
        {
            label: "Testers Calificados",
            value: "—",
        },
    ];
    return {
        stateColor,
        stateProgress,
        router,
        projects,
        postulations,
        reports,
        loading,
        activeCount,
        pendingPostulations,  
        stats
    }
}