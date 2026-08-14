"use client";

import { useUser } from "@/context/UserContext";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useUser();
  const [editing, setEditing] = useState(false);
  if (!user) return null;

  return (
    <div className="px-6 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Información de tu cuenta</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-2xl">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 capitalize">{user.role}</span>
          </div>
          <button onClick={() => setEditing(!editing)} className="ml-auto text-sm font-medium text-[#2d6a4f] hover:underline">
            {editing ? "Cancelar" : "Editar perfil"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { label: "Nombre completo", value: user.name, type: "text" },
            { label: "Correo electrónico", value: user.email, type: "email" },
            { label: "Rol", value: user.role, type: "text", disabled: true },
          ].map((field) => (
            <div key={field.label} className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">{field.label}</label>
              <input
                type={field.type}
                defaultValue={field.value}
                disabled={!editing || field.disabled}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-gray-50 disabled:text-gray-400 capitalize"
              />
            </div>
          ))}
          {user.role === "tester" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Especialidades</label>
              <input type="text" defaultValue="Web, Mobile, Security" disabled={!editing} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          )}
        </div>
        {editing && (
          <button className="mt-5 w-full rounded-full py-2.5 text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#e07b39" }}>Guardar cambios</button>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Cambiar contraseña</h3>
        <div className="flex flex-col gap-3">
          {["Contraseña actual", "Nueva contraseña", "Confirmar nueva contraseña"].map((label) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">{label}</label>
              <input type="password" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
          ))}
          <button className="mt-2 rounded-full py-2.5 text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: "#2d6a4f" }}>Actualizar contraseña</button>
        </div>
      </div>
    </div>
  );
}
