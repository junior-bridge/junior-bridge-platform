import { User } from "@/types";
import { UserDashboard } from "@/types/dashboardTypes";
import { getAdminUsers } from "@/services/user.service";
import { useState , useEffect , useMemo } from "react";


export const useDashboardUsers = (user : User | null) => {
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

    const [users, setUsers] = useState<UserDashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"Todos" | "TESTER" | "CLIENT">( "Todos",);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === "Todos" || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);
    const totalPages = Math.ceil(filteredUsers.length / pageSize);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;

        return filteredUsers.slice(startIndex, startIndex + pageSize);
    }, [filteredUsers, currentPage]);
useEffect(() => {
    setCurrentPage(1);
}, [searchTerm, roleFilter]);    

useEffect(() => {
    async function fetchUsers() {
        try {
            setLoading(true);

            const data = await getAdminUsers();

            const dashboardUsers: UserDashboard[] = data.map((u) => ({
                id: String(u.id),
                name: `${u.name} ${u.surname}`,
                email: u.email,
                role: u.role,
                status: u.is_active ? "activo" : "suspendido",
                joined: new Date(u.created_at).toLocaleDateString("es-AR"),
                projects: u.projects_count,
                reputation: u.reputation,
            }));

            setUsers(dashboardUsers);
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

    return{
        roleColors,
        statusColors,
        loading,
        searchTerm,
        setSearchTerm,
        roleFilter,
        setRoleFilter,
        filteredUsers,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedUsers,
    }
}