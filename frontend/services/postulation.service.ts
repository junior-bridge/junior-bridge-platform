import { Postulation } from "@/types/postulationTypes";
import { getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";

export async function applyToProject(projectId: number): Promise<Postulation> {
    await getCsrfToken();
    return apiFetch<Postulation>(`/api/projects/${projectId}/postulations/`, {
        method: "POST",
    });
}

export async function getProjectPostulations(
    projectId: number,
): Promise<Postulation[]> {
    return apiFetch<Postulation[]>(`/api/projects/${projectId}/postulations/`);
}

export async function getUserPostulations(): Promise<Postulation[]> {
    return apiFetch<Postulation[]>("/api/postulations/user-active/");
}

export async function getPostulation(id: number): Promise<Postulation> {
    return apiFetch<Postulation>(`/api/postulations/${id}/`);
}

export async function acceptPostulation(id: number): Promise<Postulation> {
    await getCsrfToken();
    return apiFetch<Postulation>(`/api/postulations/${id}/accept/`, {
        method: "POST",
    });
}

export async function rejectPostulation(id: number): Promise<Postulation> {
    await getCsrfToken();
    return apiFetch<Postulation>(`/api/postulations/${id}/reject/`, {
        method: "POST",
    });
}

export async function deletePostulation(id: number): Promise<void> {
    await getCsrfToken();
    return apiFetch<void>(`/api/postulations/${id}/`, { method: "DELETE" });
}
