"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { Search, UserPlus, Loader2 } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: "TESTER" | "CLIENT" | "ADMIN";
    status: "activo" | "pendiente" | "suspendido";
    joined: string;
    projects: number;
    reputation: string;
}

const roleColors: Record<string, string> = {
    TESTER: "bg-blue-100 text-blue-700",
    CLIENT: "bg-orange-100 text-orange-700",
    ADMIN: "bg-purple-100 text-purple-700",
};

const statusColors: Record<string, string> = {
    activo: "bg-green-100 text-green-700",
    pendiente: "bg-yellow-100 text-yellow-700",
    suspendido: "bg-red-100 text-red-600",
};

export default function UsersPage() {
    const { user } = useUser();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"Todos" | "TESTER" | "CLIENT">(
        "Todos",
    );

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);

                const response = await fetch("/api/users/", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) throw new Error("Error al obtener usuarios");

                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error("Error cargando usuarios:", error);
            } finally {
                setLoading(false);
            }
        }

        if (user?.role === "ADMIN") {
            fetchUsers();
        }
    }, [user]);

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === "Todos" || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="px-6 py-6">
                <p className="text-gray-500">Acceso restringido.</p>
            </div>
        );
    }

    return (
        <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Usuarios
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {loading
                            ? "Cargando..."
                            : `${filteredUsers.length} usuarios encontrados`}
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 rounded-full px-5 py-2.5 text-white text-sm font-semibold hover:opacity-90"
                    style={{ backgroundColor: "#e07b39" }}
                >
                    <UserPlus size={15} /> Invitar usuario
                </button>
            </div>
            <div className="flex gap-3 mb-5">
                <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-64 border border-gray-200">
                    <Search size={14} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm outline-none w-full placeholder-gray-400"
                    />
                </div>

                {(["Todos", "TESTER", "CLIENT"] as const).map((filterRole) => {
                    const labelMap = {
                        Todos: "Todos",
                        TESTER: "Testers",
                        CLIENT: "Emprendedores",
                    };
                    const isActive = roleFilter === filterRole;

                    return (
                        <button
                            key={filterRole}
                            onClick={() => setRoleFilter(filterRole)}
                            className={`px-4 py-2 rounded-full text-xs font-medium border transition ${
                                isActive
                                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-teal-300"
                            }`}
                        >
                            {labelMap[filterRole]}
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-10 flex justify-center items-center gap-2 text-gray-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm">Cargando usuarios...</span>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                                {[
                                    "Usuario",
                                    "Rol",
                                    "Estado",
                                    "Registro",
                                    "Proyectos",
                                    "Reputación",
                                    "Acciones",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 font-semibold"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-gray-400 text-xs"
                                    >
                                        No se encontraron usuarios con esos
                                        criterios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr
                                        key={u.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-orange-300 flex items-center justify-center text-white text-xs font-bold uppercase">
                                                    {u.name ? u.name[0] : "U"}
                                                </div>
                                                <div>
                                                    <p className="text-gray-700 font-medium text-xs">
                                                        {u.name}
                                                    </p>
                                                    <p className="text-gray-400 text-[10px]">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role] || "bg-gray-100 text-gray-600"}`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[u.status] || "bg-gray-100 text-gray-600"}`}
                                            >
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                            {u.joined}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-center text-xs">
                                            {u.projects}
                                        </td>
                                        <td className="px-4 py-3 text-orange-500 text-xs font-medium">
                                            {u.reputation &&
                                            u.reputation !== "-"
                                                ? `${u.reputation} ★`
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button className="text-[10px] px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium">
                                                    Ver
                                                </button>
                                                <button className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                                                    Suspender
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
