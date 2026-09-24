import { User } from "@/types";
import { useRouter } from "next/navigation";
import {useEffect} from "react";






export const useDashboard=({isLoading, isAuthenticated,logout,user}: {isLoading: boolean; isAuthenticated: boolean; logout: () => Promise<void>; user: User })=>{
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isLoading, router]);

    async function handleLogout() {
            await logout();
            router.push("/login");
    }
    
    const displayName =
            user.name?.trim() || user.email?.split("@")[0] || "Usuario";
    
    const avatarInitials = (
            user.name?.trim()?.[0] ||
            user.email?.trim()?.[0] ||
            "?"
    ).toUpperCase();
    
    const roleLabel: Record<string, string> = {
            CLIENT: "Emprendedor",
            TESTER: "Tester",
            ADMIN: "Admin",
    };


    return {
        router,
        handleLogout,
        displayName,
        avatarInitials,
        roleLabel
    }
}