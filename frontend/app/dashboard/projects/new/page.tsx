"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

type ProjectForm = {
  title: string;
  description: string;
  repository: string;
  demo_url: string;
  technologies: string;
  modality: string;
};

type ProjectFormErrors = Partial<Record<keyof ProjectForm, string>>;

const initialForm: ProjectForm = {
  title: "",
  description: "",
  repository: "",
  demo_url: "",
  technologies: "",
  modality: "",
};

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function NewProjectPage() {
  const { user } = useUser();
  const router = useRouter();
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const [errors, setErrors] = useState<ProjectFormErrors>({});

  useEffect(() => {
    if (user && user.role !== "emprendedor") {
      router.replace("/dashboard/projects");
    }
  }, [router, user]);

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
      nextErrors.repository = "Ingresá una URL válida que comience con http:// o https://.";
    }

    if (!form.demo_url.trim()) {
      nextErrors.demo_url = "La URL de la demo es obligatoria.";
    } else if (!isValidHttpUrl(form.demo_url.trim())) {
      nextErrors.demo_url = "Ingresá una URL válida que comience con http:// o https://.";
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof ProjectForm;
    const value = event.target.value;

    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
  }

  function getInputClassName(field: keyof ProjectForm) {
    const borderClass = errors[field]
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-200 focus:ring-teal-300";

    return `border rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 ${borderClass}`;
  }

  if (!user || user.role !== "emprendedor") return null;

  return (
    <main className="px-6 py-6 max-w-3xl">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#2d6a4f] hover:underline mb-5"
      >
        <ArrowLeft size={16} /> Volver a proyectos
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Publicar proyecto</h1>
        <p className="text-gray-500 text-sm mt-1">
          Completá la información para enviar tu proyecto a revisión.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm text-gray-600 font-medium">
              Título del proyecto
            </label>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={100}
              required
              value={form.title}
              onChange={handleChange}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              placeholder="Ej.: Plataforma de gestión para comercios"
              className={getInputClassName("title")}
            />
            {errors.title && <p id="title-error" className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm text-gray-600 font-medium">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              required
              value={form.description}
              onChange={handleChange}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "description-error" : undefined}
              placeholder="Contanos de qué se trata el proyecto y qué necesitás validar."
              className={`${getInputClassName("description")} resize-y`}
            />
            {errors.description && <p id="description-error" className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="repository" className="text-sm text-gray-600 font-medium">
                URL del repositorio
              </label>
              <input
                id="repository"
                name="repository"
                type="url"
                required
                value={form.repository}
                onChange={handleChange}
                aria-invalid={Boolean(errors.repository)}
                aria-describedby={errors.repository ? "repository-error" : undefined}
                placeholder="https://github.com/usuario/proyecto"
                className={getInputClassName("repository")}
              />
              {errors.repository && <p id="repository-error" className="text-xs text-red-500">{errors.repository}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="demo_url" className="text-sm text-gray-600 font-medium">
                URL de la demo
              </label>
              <input
                id="demo_url"
                name="demo_url"
                type="url"
                required
                value={form.demo_url}
                onChange={handleChange}
                aria-invalid={Boolean(errors.demo_url)}
                aria-describedby={errors.demo_url ? "demo-url-error" : undefined}
                placeholder="https://mi-proyecto.com"
                className={getInputClassName("demo_url")}
              />
              {errors.demo_url && <p id="demo-url-error" className="text-xs text-red-500">{errors.demo_url}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1">
              <label htmlFor="technologies" className="text-sm text-gray-600 font-medium">
                Tecnologías
              </label>
              <input
                id="technologies"
                name="technologies"
                type="text"
                required
                value={form.technologies}
                onChange={handleChange}
                aria-invalid={Boolean(errors.technologies)}
                aria-describedby={errors.technologies ? "technologies-error" : undefined}
                placeholder="React, Django, PostgreSQL"
                className={getInputClassName("technologies")}
              />
              {errors.technologies && <p id="technologies-error" className="text-xs text-red-500">{errors.technologies}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="modality" className="text-sm text-gray-600 font-medium">
                Modalidad
              </label>
              <select
                id="modality"
                name="modality"
                required
                value={form.modality}
                onChange={handleChange}
                aria-invalid={Boolean(errors.modality)}
                aria-describedby={errors.modality ? "modality-error" : undefined}
                className={getInputClassName("modality")}
              >
                <option value="" disabled>Seleccioná una modalidad</option>
                <option value="REMOTE">Remoto</option>
                <option value="ON_SITE">Presencial</option>
                <option value="HYBRID">Híbrido</option>
              </select>
              {errors.modality && <p id="modality-error" className="text-xs text-red-500">{errors.modality}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-gray-100">
          <Link
            href="/dashboard/projects"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: "#e07b39" }}
          >
            Publicar proyecto
          </button>
        </div>
      </form>
    </main>
  );
}
