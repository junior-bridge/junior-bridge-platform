import { applyToProject, deletePostulation, getProjectPostulations, getUserPostulations } from "@/services/postulation.service";
import { completeProject, finishProjectDelivery, getProjects, getUserProjects, updateProjectState } from "@/services/project.service";
import { createRating, getRating } from "@/services/rating.service";
import { User } from "@/types";
import { Postulation } from "@/types/postulationTypes";
import { Project, ProjectState } from "@/types/projectTypes";
import { Rating } from "@/types/ratingTypes";
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
    const [postulationToWithdraw, setPostulationToWithdraw] = useState<Postulation | null>(null);
    const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [messageError, setMessageError] = useState(false);
    const [ratingsByProject, setRatingsByProject] = useState<
        Record<number, { postulationId: number; rating: Rating | null }>
    >({});
    
    useEffect(() => {
            async function loadData() {
                try {
                if (isClient) {
                    const projs = await getUserProjects();
                    setProjects(projs);

                    const completedProjects = projs.filter(
                        (project) => project.state === "COMPLETED",
                    );

                    const ratingsEntries = await Promise.all(
                        completedProjects.map(async (project) => {
                            const postulations = await getProjectPostulations(project.id);

                            const acceptedPostulation = postulations.find(
                                (postulation) => postulation.status === "accepted",
                            );

                            if (!acceptedPostulation) {
                                return null;
                            }

                            try {
                                const rating = await getRating(
                                    acceptedPostulation.id_postulation,
                                );

                                return [
                                    project.id,
                                    {
                                        postulationId: acceptedPostulation.id_postulation,
                                        rating,
                                    },
                                ] as const;
                            } catch {
                                return [
                                    project.id,
                                    {
                                        postulationId: acceptedPostulation.id_postulation,
                                        rating: null,
                                    },
                                ] as const;
                            }
                        }),
                    );

                    setRatingsByProject(
                        Object.fromEntries(
                            ratingsEntries.filter(
                                (entry): entry is NonNullable<typeof entry> =>
                                    entry !== null,
                            ),
                        ),
                    );
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
    
    const postulationsByProject = new Map(
        postulations.map((postulation) => [postulation.id_project, postulation]),
    );
    
    const filteredProjects = projects.filter(
            (p) =>
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.technologies.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    
    async function handleApply(projectId: number) {
            setApplyingId(projectId);
            setMessage("");
            setMessageError(false);
            try {
                const newPost = await applyToProject(projectId);
                setMyPostulations((prev) => [...prev, newPost]);
            } catch (err) {
                alert(err instanceof Error ? err.message : "Error al postularse.");
            } finally {
                setApplyingId(null);
            }
    }

    async function handleWithdraw() {
        if (!postulationToWithdraw) return;

        setWithdrawingId(postulationToWithdraw.id_postulation);
        setMessage("");
        setMessageError(false);

        try {
            await deletePostulation(postulationToWithdraw.id_postulation);
            setMyPostulations((prev) =>
                prev.filter(
                    (postulation) =>
                        postulation.id_postulation !==
                        postulationToWithdraw.id_postulation,
                ),
            );
            setPostulationToWithdraw(null);
            setMessage("Postulación retirada correctamente.");
        } catch (err) {
            setMessageError(true);
            setMessage(
                err instanceof Error
                    ? err.message
                    : "No se pudo retirar la postulación.",
            );
        } finally {
            setWithdrawingId(null);
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

    async function handleCompleteProject(projectId: number) {
        try {
            await completeProject(projectId);

            setProjects((prev) =>
                prev.map((p) =>
                    p.id === projectId
                        ? { ...p, state: "COMPLETED" }
                        : p,
                ),
            );

            setMessage("Proyecto completado correctamente.");
            setMessageError(false);
        } catch (err) {
            setMessageError(true);
            setMessage(
                err instanceof Error
                    ? err.message
                    : "No se pudo completar el proyecto.",
            );
        }
    }

    async function handleFinishDelivery(projectId: number) {
        try {
            await finishProjectDelivery(projectId);

            setProjects((prev) =>
                prev.map((p) =>
                    p.id === projectId
                        ? { ...p, state: "IN_REVIEW" }
                        : p,
                ),
            );

            setMessage("Entrega finalizada correctamente.");
            setMessageError(false);
        } catch (err) {
            setMessageError(true);
            setMessage(
                err instanceof Error
                    ? err.message
                    : "No se pudo finalizar la entrega.",
            );
        }
    }

    async function handleCreateRating(
        projectId: number,
        stars: number,
        comment: string,
    ) {
        const ratingData = ratingsByProject[projectId];

        if (!ratingData) {
            return;
        }

        try {
            const rating = await createRating(
                ratingData.postulationId,
                {
                    stars,
                    comment,
                },
            );

            setRatingsByProject((prev) => ({
                ...prev,
                [projectId]: {
                    ...prev[projectId],
                    rating,
                },
            }));

            setMessage("Calificación guardada correctamente.");
            setMessageError(false);
        } catch (err) {
            setMessageError(true);
            setMessage(
                err instanceof Error
                    ? err.message
                    : "No se pudo guardar la calificación.",
            );
        }
    }    
        
    return {
        statusColors,
        searchTerm,
        setSearchTerm,
        loading,
        ratingsByProject,
        applyingId,
        handleApply,
        handleStatusChange,
        handleCompleteProject,
        handleFinishDelivery,
        handleCreateRating,
        postulationsByProject,
        filteredProjects,
        postulationToWithdraw,
        setPostulationToWithdraw,
        withdrawingId,
        handleWithdraw,
        message,
        messageError,
    }
}
