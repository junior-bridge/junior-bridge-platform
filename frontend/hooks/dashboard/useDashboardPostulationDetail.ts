import {
    acceptPostulation,
    getPostulation,
    rejectPostulation,
} from "@/services/postulation.service";
import { Postulation } from "@/types/postulationTypes";
import { useEffect, useState } from "react";

export const useDashboardPostulationDetail = (id: number) => {
    const [postulation, setPostulation] = useState<Postulation | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageError, setMessageError] = useState(false);
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
        setMessage("");
        setMessageError(false);

        try {
            const updated =
                action === "accept"
                    ? await acceptPostulation(postulation.id_postulation)
                    : await rejectPostulation(postulation.id_postulation);

            setPostulation(updated);
            setMessage(
                action === "accept"
                    ? "Postulación aceptada correctamente."
                    : "Postulación rechazada correctamente.",
            );
        } catch (err) {
            setMessageError(true);
            setMessage(
                err instanceof Error
                    ? err.message
                    : "No se pudo actualizar la postulación.",
            );
        } finally {
            setActionLoading(false);
        }
    }

    return {
        postulation,
        loading,
        actionLoading,
        message,
        messageError,
        error,
        handleStatusChange,
    };
};
