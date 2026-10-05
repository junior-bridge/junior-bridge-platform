import {
    acceptPostulation,
    getPostulation,
    rejectPostulation,
} from "@/services/postulation.service";
import { Postulation } from "@/types/postulationTypes";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export const useDashboardPostulationDetail = (id: number) => {
    const [postulation, setPostulation] = useState<Postulation | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadPostulation() {
            if (!Number.isInteger(id) || id <= 0) {
                setError("La postulación indicada no es válida.");
                setLoading(false);
                return;
            }

            try {
                const data = await getPostulation(id);
                setPostulation(data);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "";

                setError(
                    errorMessage === "Postulation not found."
                        ? "No se encontró la postulación."
                        : errorMessage || "No se pudo cargar la postulación.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadPostulation();
    }, [id]);

    async function handleStatusChange(action: "accept" | "reject") {
        if (!postulation) return;

        setActionLoading(true);

        if (action === "reject") {
            const result = await Swal.fire({
                title: "¿Rechazar postulación?",
                text: "Esta acción cambiará el estado de la postulación.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, rechazar",
                cancelButtonText: "Cancelar",
            });

            if (!result.isConfirmed) {
                setActionLoading(false);
                return;
            }
        }

        try {
            const updated =
                action === "accept"
                    ? await acceptPostulation(postulation.id_postulation)
                    : await rejectPostulation(postulation.id_postulation);

            setPostulation(updated);
            await Swal.fire({
                title:
                    action === "accept"
                        ? "Postulación aceptada"
                        : "Postulación rechazada",
                text:
                    action === "accept"
                        ? "La postulación fue aceptada correctamente."
                        : "La postulación fue rechazada correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar",
            });
        } catch {
            await Swal.fire({
                title:
                    action === "accept"
                        ? "No se pudo aceptar la postulación"
                        : "No se pudo rechazar la postulación",
                text: "Ocurrió un error al actualizar la postulación. Intentá nuevamente.",
                icon: "error",
                confirmButtonText: "Aceptar",
            });
        } finally {
            setActionLoading(false);
        }
    }

    return {
        postulation,
        loading,
        actionLoading,
        error,
        handleStatusChange,
    };
};
