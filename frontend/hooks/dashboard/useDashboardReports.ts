import { useState ,useEffect ,useCallback } from "react";
import {type ReportFormErrors} from "@/types/dashboardTypes";
import { User } from "@/types";
import { Postulation } from "@/types/postulationTypes";
import { Report } from "@/types/reportTypes";
import { getUserPostulations } from "@/services/postulation.service";
import { createReport, getPostulationReports } from "@/services/report.service";
import Swal from "sweetalert2";

// Estado inicial del formulario de reporte; se reutiliza al cerrar/cancelar y después de crear.
const initialReportForm: {
    postulationId: string;
    title: string;
    description: string;
    stepsToReproduce: string;
    severity: "low" | "medium" | "high" | "critical";
    evidenceFile: File | null;
} = {
    postulationId: "",
    title: "",
    description: "",
    stepsToReproduce: "",
    severity: "medium",
    evidenceFile: null,
};

export const useDashboardReports = (user:User | null) => {

    const severityColors: Record<string, string> = {
        high: "bg-red-100 text-red-600",
        medium: "bg-yellow-100 text-yellow-700",
        low: "bg-green-100 text-green-700",
    };
    
    const statusColors: Record<string, string> = {
        PENDING: "bg-blue-100 text-blue-700",
        REVIEW: "bg-orange-100 text-orange-600",
        CLOSED: "bg-teal-100 text-teal-700",
    };
    
    const severityLabels: Record<string, string> = {
        high: "ALTA",
        medium: "MEDIA",
        low: "BAJA",
    };
    
    const statusLabels: Record<string, string> = {
        PENDING: "ABIERTO",
        REVIEW: "EN REVISIÓN",
        CLOSED: "RESUELTO",
    };
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<ReportFormErrors>({});
    const [userPostulations, setUserPostulations] = useState<Postulation[]>([]);

     const [form ,setForm]=useState(initialReportForm)

    // Cierra la modal y descarta el formulario, los errores de campo y el error general.
    const resetReportModal = useCallback(() => {
        setIsModalOpen(false);
        setModalError(null);
        setFormErrors({});
        setForm(initialReportForm);
    }, []);

    // Cierre iniciado por el usuario (X, Cancelar, backdrop, Escape).
    // Mientras se envía el reporte no se permite cerrar, para no perder el resultado del submit.
    const closeReportModal = useCallback(() => {
        if (submitting) return;
        resetReportModal();
    }, [submitting, resetReportModal]);

    useEffect(() => {
        if (!isModalOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeReportModal();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, closeReportModal]);
    
    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }
     useEffect(() => {
        let isMounted = true;

        if (!user) return;

        async function initFetch() {
            try {
                setError(null);
                const postulations = await getUserPostulations();

                if (!isMounted) return;
                setUserPostulations(postulations);

                const reportsPromises = postulations.map((p) =>
                    getPostulationReports(p.id_postulation).catch(() => []),
                );
                const reportsNested = await Promise.all(reportsPromises);

                if (!isMounted) return;
                setReports(reportsNested.flat());
            } catch (err) {
                if (!isMounted) return;
                console.error("Error cargando reportes:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "No se pudieron cargar los reportes.",
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initFetch();

        return () => {
            isMounted = false;
        };
    }, [user]);

     const loadReports = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);

            const postulations = await getUserPostulations();
            setUserPostulations(postulations);

            const reportsPromises = postulations.map((p) =>
                getPostulationReports(p.id_postulation).catch(() => []),
            );
            const reportsNested = await Promise.all(reportsPromises);

            setReports(reportsNested.flat());
        } catch (err) {
            console.error("Error cargando reportes:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar los reportes.",
            );
        } finally {
            setLoading(false);
        }
    }, []);


    async function handleCreateReport(e: React.FormEvent) {
        e.preventDefault();
        const nextErrors: ReportFormErrors = {};

        if (!form.postulationId) {
            nextErrors.postulationId = "Seleccioná una postulación.";
        }
        if (!form.title.trim()) {
            nextErrors.title = "El título del bug es obligatorio.";
        }
        if (!form.description.trim()) {
            nextErrors.description = "La descripción es obligatoria.";
        }
        if (!form.stepsToReproduce.trim()) {
            nextErrors.stepsToReproduce =
                "Los pasos para reproducir son obligatorios.";
        }

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        try {
            setSubmitting(true);
            setModalError(null);

            const steps = form.stepsToReproduce
                .split("\n")
                .map((step) => step.trim())
                .filter((step) => step.length > 0);
                
            try {
                await createReport(Number(form.postulationId), {
                    title: form.title.trim(),
                    description: form.description.trim(),
                    severity: form.severity,
                    steps_to_reproduce: steps,
                    capture_evidence: form.evidenceFile ?? undefined,
                });
            } catch (err) {
                console.error("Error al crear reporte:", err);
                const message = err instanceof Error ? err.message : "";

                if (message.includes("No Postulation matches")) {
                    setModalError(
                        "La postulación elegida no existe o no tienes acceso a ella.",
                    );
                } else {
                    await Swal.fire({
                        title: "No se pudo crear el reporte",
                        text: "Ocurrió un error al crear el reporte. Intentá nuevamente.",
                        icon: "error",
                        confirmButtonText: "Aceptar",
                    });
                }

                return;
            }

            resetReportModal();

            try {
                await loadReports();
            } catch (err) {
                console.error(
                    "El reporte fue creado, pero no se pudo actualizar el listado:",
                    err,
                );
            }

            await Swal.fire({
                title: "Reporte creado",
                text: "El reporte de bug se creó correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar",
            });
        } finally {
            setSubmitting(false);
        }
    }
    
    return{
        severityColors,
        statusColors,
        severityLabels,
        statusLabels,
        reports,
        loading,
        error,
        isModalOpen,
        setIsModalOpen,
        closeReportModal,
        submitting,
        modalError,
        formErrors,
        setFormErrors,
        userPostulations,
        formatDate,
        handleCreateReport,
        form,
        setForm
    }
}
