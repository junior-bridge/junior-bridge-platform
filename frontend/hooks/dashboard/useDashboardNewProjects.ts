import { createProject } from "@/services/project.service";
import { User } from "@/types";
import { ProjectForm, ProjectFormErrors } from "@/types/dashboardTypes";
import { ProjectModality } from "@/types/projectTypes";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";  
import Swal from "sweetalert2";

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
    }
    
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
            event.preventDefault();
            if (!validateForm()) return;
    
            setIsSubmitting(true);
    
            try {
                await createProject({
                    title: form.title.trim(),
                    description: form.description.trim(),
                    repository: form.repository.trim(),
                    demo_url: form.demo_url.trim(),
                    technologies: form.technologies.trim(),
                    modality: form.modality as ProjectModality,
                });
    
                await Swal.fire({
                    title: "Proyecto creado",
                    text: "El proyecto se creó correctamente.",
                    icon: "success",
                    confirmButtonText: "Aceptar",
                });

                router.push("/dashboard/projects");
            } catch {
                await Swal.fire({
                    title: "No se pudo crear el proyecto",
                    text: "Ocurrió un error al crear el proyecto. Intentá nuevamente.",
                    icon: "error",
                    confirmButtonText: "Aceptar",
                });
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
        handleChange,
        handleSubmit,
        getControlClassName,
    }
}
