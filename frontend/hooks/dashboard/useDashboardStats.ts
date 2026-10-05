import { getAdminStats } from "@/services/admin.service";
import { User } from "@/types";
import { AdminStats } from "@/types/adminTypes";
import { useState , useEffect } from "react";


export const useDashboardStats = (user : User | null) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== "ADMIN") {
        setLoading(false);
        return;
        }

        async function loadStats() {
        try {
            const data = await getAdminStats();
            setStats(data);
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
        } finally {
            setLoading(false);
        }
        }

        loadStats();
    }, [user]);

    const monthlyData = stats?.bugs_by_month ?? [];
    
    const maxBugs = Math.max(
        ...monthlyData.map((d) => d.bugs),
        1
      );
    const roleDistribution = stats?.role_distribution;
    
    const totalRoles = roleDistribution
        ? roleDistribution.testers +
          roleDistribution.clients +
          roleDistribution.admins
        : 0;

    return{
        stats,
        loading,
        monthlyData,
        maxBugs,
        roleDistribution,
        totalRoles
    }
}