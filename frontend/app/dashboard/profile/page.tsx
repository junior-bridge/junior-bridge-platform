"use client";

import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { updateProfilePhoto } from "@/services/user.service";
import { getMediaUrl } from "@/lib/media";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const { user, setUser } = useUser();
    const [editing, setEditing] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoSaved, setPhotoSaved] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(
        () => () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        },
        [photoPreview],
    );

    if (!user) return null;
    const profilePhotoUrl = getMediaUrl(user.profile_photo);

    async function handlePhotoUpload() {
        if (!photoFile) return;

        setUploadingPhoto(true);
        setPhotoError(null);
        setPhotoSaved(false);

        try {
            const updatedUser = await updateProfilePhoto(photoFile);
            setUser(updatedUser);
            setPhotoFile(null);
            setPhotoSaved(true);
        } catch (error) {
            setPhotoError(
                error instanceof Error
                    ? error.message
                    : "No se pudo actualizar la foto de perfil.",
            );
        } finally {
            setUploadingPhoto(false);
        }
    }

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600 text-sm mt-1">
                    Información de tu cuenta
                </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="relative w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center overflow-hidden text-white font-bold text-2xl">
                        {photoPreview || profilePhotoUrl ? (
                            <Image
                                src={photoPreview ?? profilePhotoUrl ?? ""}
                                alt="Foto de perfil"
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            (user.name[0]?.toUpperCase() ?? "?")
                        )}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {user.name}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 capitalize">
                            {user.role}
                        </span>
                    </div>
                    <button
                        onClick={() => setEditing(!editing)}
                        className="ml-auto text-sm font-medium text-brand-green hover:underline cursor-pointer"
                    >
                        {editing ? "Cancelar" : "Editar perfil"}
                    </button>
                </div>

                <div className="mb-6 rounded-lg border border-gray-100 p-4">
                    <label
                        htmlFor="profile-photo"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Foto de perfil
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            id="profile-photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setPhotoSaved(false);
                                setPhotoError(null);

                                if (
                                    file &&
                                    ![
                                        "image/jpeg",
                                        "image/png",
                                        "image/webp",
                                    ].includes(file.type)
                                ) {
                                    setPhotoError(
                                        "Elegí una imagen JPG, PNG o WEBP.",
                                    );
                                    setPhotoFile(null);
                                    setPhotoPreview(null);
                                    event.target.value = "";
                                    return;
                                }
                                if (file && file.size > 5 * 1024 * 1024) {
                                    setPhotoError(
                                        "La imagen debe pesar 5 MB o menos.",
                                    );
                                    setPhotoFile(null);
                                    setPhotoPreview(null);
                                    event.target.value = "";
                                    return;
                                }
                                setPhotoFile(file);
                                setPhotoPreview(
                                    file ? URL.createObjectURL(file) : null,
                                );
                            }}
                            className="block max-w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                        />
                        {photoFile && (
                            <button
                                type="button"
                                onClick={handlePhotoUpload}
                                disabled={uploadingPhoto}
                                className="btn-primary disabled:opacity-50"
                            >
                                {uploadingPhoto
                                    ? "Guardando..."
                                    : "Guardar foto"}
                            </button>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                        JPG, PNG o WEBP; hasta 5 MB. Se optimiza al subirla.
                    </p>
                    {photoError && (
                        <p role="alert" className="mt-2 text-sm text-red-600">
                            {photoError}
                        </p>
                    )}
                    {photoSaved && (
                        <p className="mt-2 text-sm text-green-700">
                            Foto de perfil actualizada.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {[
                        {
                            label: "Nombre completo",
                            value: user.name,
                            type: "text",
                        },
                        {
                            label: "Correo electrónico",
                            value: user.email,
                            type: "email",
                        },
                        {
                            label: "Rol",
                            value: user.role,
                            type: "text",
                            disabled: true,
                        },
                    ].map((field) => (
                        <div key={field.label} className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                defaultValue={field.value}
                                disabled={!editing || field.disabled}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-gray-50 disabled:text-gray-600 capitalize"
                            />
                        </div>
                    ))}
                    {user.role === "TESTER" && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">
                                Especialidades
                            </label>
                            <input
                                type="text"
                                defaultValue="Web, Mobile, Security"
                                disabled={!editing}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-gray-50 disabled:text-gray-600"
                            />
                        </div>
                    )}
                </div>
                {editing && (
                    <button className="mt-5 w-full btn-primary">
                        Guardar cambios
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">
                    Cambiar contraseña
                </h3>
                <div className="flex flex-col gap-3">
                    {[
                        "Contraseña actual",
                        "Nueva contraseña",
                        "Confirmar nueva contraseña",
                    ].map((label) => (
                        <div key={label} className="flex flex-col gap-1">
                            <label className="text-sm text-gray-600 font-medium">
                                {label}
                            </label>
                            <input
                                type="password"
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                            />
                        </div>
                    ))}
                    <button className="mt-2 w-full btn-secondary cursor-pointer">
                        Actualizar contraseña
                    </button>
                </div>
            </div>
        </div>
    );
}
