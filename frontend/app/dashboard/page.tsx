"use client";

import { useUser } from "@/context/UserContext";
import EmprendedorDashboard from "@/app/dashboard/views/EmprendedorDashboard";
import TesterDashboard from "@/app/dashboard/views/TesterDashboard";
import AdminDashboard from "@/app/dashboard/views/AdminDashboard";

export default function DashboardPage() {
  const { user } = useUser();

  if (!user) return null;

  switch (user.role) {
    case "emprendedor":
      return <EmprendedorDashboard userName={user.name} />;
    case "tester":
      return <TesterDashboard userName={user.name} />;
    case "admin":
      return <AdminDashboard userName={user.name} />;
  }
}
