"use client";

import { useUser } from "@/context/UserContext";
import EmprendedorDashboard from "@/app/dashboard/views/EmprendedorDashboard";
import TesterDashboard from "@/app/dashboard/views/TesterDashboard";
import AdminDashboard from "@/app/dashboard/views/AdminDashboard";

export default function DashboardPage() {
  const { user } = useUser();
  if (!user) return null;

  switch (user.role) {
    case "CLIENT":
      return <EmprendedorDashboard userName={user.name} />;
    case "TESTER":
      return <TesterDashboard userName={user.name} />;
    case "ADMIN":
      return <AdminDashboard userName={user.name} />;
  }
}
