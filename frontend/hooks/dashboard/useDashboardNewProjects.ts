import { createProject } from "@/services/project.service";
import { User } from "@/types";
import { ProjectForm, ProjectFormErrors } from "@/types/dashboardTypes";
import { ProjectModality } from "@/types/projectTypes";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";  

export const useDashboardNewProjects = ({user, isClient}: {user: User | null; isClient: boolean}) => {
    const initialForm: ProjectForm = {
    title: "",
    description: "",
    repository: "",
    demo_url: "",
    technologies: "",
    modality: "",
};

    //Se podria colocar esta funcion en un Helper.ts al igual que otras funciones que se usan una sola vez 
    function isValidHttpUrl(value: string) {
        try {
            const url = new URL(value);
            return (
                (url.protocol === "http:" || url.protocol === "https:") &&
                url.hostname.toLowerCase().endsWith(".com")
            );
        } catch {
            return false;
        }
    }
    const router = useRouter();
    const [form, setForm] = useState<ProjectForm>(initialForm);
    const [errors, setErrors] = useState<ProjectFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (user && !isClient) {
            router.replace("/dashboard/projects");
        }
    }, [isClient, router, user]);

    function validateForm() {
            const nextErrors: ProjectFormErrors = {};
    
            if (!form.title.trim()) {
                nextErrors.title = "El título es obligatorio.";
            } else if (form.title.trim().length > 100) {
                nextErrors.title = "El título no puede superar los 100 caracteres.";
            }
    
            if (!form.description.trim()) {
                nextErrors.description = "La descripción es obligatoria.";
            }
    
            if (!form.repository.trim()) {
                nextErrors.repository = "La URL del repositorio es obligatoria.";
            } else if (!isValidHttpUrl(form.repository.trim())) {
                nextErrors.repository =
                    "Ingresá una URL válida que comience con http:// o https:// y termine en .com.";
            }
    
            if (!form.demo_url.trim()) {
                nextErrors.demo_url = "La URL de la demo es obligatoria.";
            } else if (!isValidHttpUrl(form.demo_url.trim())) {
                nextErrors.demo_url =
                    "Ingresá una URL válida que comience con http:// o https:// y termine en .com.";
            }
    
            if (!form.technologies.trim()) {
                nextErrors.technologies = "Las tecnologías son obligatorias.";
            }
    
            if (!form.modality) {
                nextErrors.modality = "Seleccioná una modalidad.";
            }
    
            setErrors(nextErrors);
            return Object.keys(nextErrors).length === 0;
    }
    
    function handleChange(
            event: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) {
            const field = event.target.name as keyof ProjectForm;
            const value = event.target.value;
    
            setForm((currentForm) => ({ ...currentForm, [field]: value }));
            setErrors((currentErrors) => ({
                ...currentErrors,
                [field]: undefined,
            }));
            setSubmitError("");
    }
    
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
            event.preventDefault();
            if (!validateForm()) return;
    
            setIsSubmitting(true);
            setSubmitError("");
    
            try {
                await createProject({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    repository: form.repository.trim(),
                    demo_url: form.demo_url.trim(),
                    technologies: form.technologies.trim(),
                    modality: form.modality as ProjectModality,
                });
    
                setSuccessMessage(
                    "Proyecto enviado correctamente y pendiente de revisión.",
                );
    
                window.setTimeout(() => {
                    router.push("/dashboard/projects");
                }, 2000);
            } catch (error) {
                setSubmitError(
                    error instanceof Error
                        ? error.message
                        : "No se pudo publicar el proyecto.",
                );
            } finally {
                setIsSubmitting(false);
            }
    }
    
    function getControlClassName(field: keyof ProjectForm) {
            const borderClass = errors[field]
                ? "border-red-400"
                : "border-gray-300";
    
            return `border rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600 ${borderClass}`;
    }

    return {
        form,
        errors,
        isSubmitting,
        submitError,
        successMessage,
        handleChange,
        handleSubmit,
        getControlClassName,
    }
}