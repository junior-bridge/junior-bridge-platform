"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Input from "@/components/ui/Input";
import { useUser } from "@/context/UserContext";
import { useDashboardNewProjects } from "@/hooks/dashboard/useDashboardNewProjects";


export default function NewProjectPage() {
    const { user, isClient } = useUser();
    const {
        errors,
        form,
        isSubmitting,
        submitError,
        successMessage,
        handleChange,
        handleSubmit,
        getControlClassName,
    }=useDashboardNewProjects({user, isClient});

    

   

    if (!user || !isClient) return null;

    return (
        <main className="px-6 py-6 max-w-3xl">
            <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#2d6a4f] hover:underline mb-5"
            >
                <ArrowLeft size={16} /> Volver a proyectos
            </Link>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Publicar proyecto
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Completá la información para enviar tu proyecto a revisión.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-white rounded-xl p-6 shadow-sm"
            >
                <div className="flex flex-col gap-5">
                    <Input
                        id="title"
                        name="title"
                        label="Título del proyecto"
                        type="text"
                        maxLength={100}
                        required
                        value={form.title}
                        onChange={handleChange}
                        error={errors.title}
                        helperText="Usá un título claro y de hasta 100 caracteres."
                        placeholder="Ej.: Plataforma de gestión para comercios"
                    />

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="description"
                            className="text-sm text-gray-600 font-medium"
                        >
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
                            aria-describedby={
                                errors.description
                                    ? "description-error"
                                    : undefined
                            }
                            placeholder="Contanos de qué se trata el proyecto y qué necesitás validar."
                            className={`${getControlClassName("description")} resize-y`}
                        />
                        {errors.description && (
                            <p
                                id="description-error"
                                className="text-xs text-red-500"
                            >
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            id="repository"
                            name="repository"
                            label="URL del repositorio"
                            type="url"
                            required
                            value={form.repository}
                            onChange={handleChange}
                            error={errors.repository}
                            helperText="Debe empezar con http:// o https:// y terminar en .com."
                            placeholder="https://github.com/usuario/proyecto"
                        />

                        <Input
                            id="demo_url"
                            name="demo_url"
                            label="URL de la demo"
                            type="url"
                            required
                            value={form.demo_url}
                            onChange={handleChange}
                            error={errors.demo_url}
                            helperText="Usá una URL de prueba que empiece con http:// o https:// y termine en .com."
                            placeholder="https://mi-proyecto.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            id="technologies"
                            name="technologies"
                            label="Tecnologías"
                            type="text"
                            required
                            value={form.technologies}
                            onChange={handleChange}
                            error={errors.technologies}
                            helperText="Separá las tecnologías con comas. Ej.: React, Django."
                            placeholder="React, Django, PostgreSQL"
                        />

                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="modality"
                                className="text-sm text-gray-600 font-medium"
                            >
                                Modalidad
                            </label>
                            <select
                                id="modality"
                                name="modality"
                                required
                                value={form.modality}
                                onChange={handleChange}
                                aria-invalid={Boolean(errors.modality)}
                                aria-describedby={
                                    errors.modality
                                        ? "modality-error"
                                        : undefined
                                }
                                className={getControlClassName("modality")}
                            >
                                <option value="" disabled>
                                    Seleccioná una modalidad
                                </option>
                                <option value="REMOTE">Remoto</option>
                                <option value="ON_SITE">Presencial</option>
                                <option value="HYBRID">Híbrido</option>
                            </select>
                            {errors.modality && (
                                <p
                                    id="modality-error"
                                    className="text-xs text-red-500"
                                >
                                    {errors.modality}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-gray-100">
                    <div className="mr-auto" aria-live="polite">
                        {submitError && (
                            <p className="text-sm text-red-500">
                                {submitError}
                            </p>
                        )}
                        {successMessage && (
                            <p className="text-sm text-green-700">
                                {successMessage}
                            </p>
                        )}
                    </div>
                    <Link
                        href="/dashboard/projects"
                        className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || Boolean(successMessage)}
                        className="rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "#e07b39" }}
                    >
                        Publicar proyecto
                    </button>
                </div>
            </form>
        </main>
    );
}
