import { AdminStats } from "@/types/adminTypes";
import { apiFetch } from "./index.service";


export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/admin/stats/");
}
