import { AdminProject, CreateProjectData, Project } from "@/types/projectTypes";
import { getCsrfToken } from "./auth.service";
import { apiFetch } from "./index.service";

export async function createProject(data: CreateProjectData): Promise<Project> {
    await getCsrfToken();

    return apiFetch<Project>("/api/projects/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getProjects(): Promise<Project[]> {
    return apiFetch<Project[]>("/api/projects/");
}

export async function getProject(id: number): Promise<Project> {
    return apiFetch<Project>(`/api/projects/${id}/`);
}

export async function updateProject(
    id: number,
    data: Partial<CreateProjectData>,
): Promise<Project> {
    await getCsrfToken();
    return apiFetch<Project>(`/api/projects/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function deleteProject(id: number): Promise<void> {
    await getCsrfToken();
    return apiFetch<void>(`/api/projects/${id}/`, { method: "DELETE" });
}

export async function updateProjectState(
    id: number,
    state: Project["state"],
): Promise<{ state: Project["state"] }> {
    await getCsrfToken();
    return apiFetch(`/api/projects/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ state }),
    });
}

export async function getUserProjects(): Promise<Project[]> {
    return apiFetch<Project[]>("/api/projects/user-active/");
}

export async function getProjectsByAdmin(): Promise<AdminProject[]> {
    return apiFetch<AdminProject[]>("/api/projects/");
}

export async function updateProjectStatus(
    id: number,
    state: "OPEN" | "REJECTED",
): Promise<{ state: "OPEN" | "REJECTED" }> {
    await getCsrfToken();

    return apiFetch<{ state: "OPEN" | "REJECTED" }>(
        `/api/projects/${id}/status/`,
        {
            method: "PATCH",
            body: JSON.stringify({ state }),
        },
    );
}
// 