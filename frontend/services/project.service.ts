import {
    AdminProject,
    AuditStrategy,
    CreateProjectData,
    Project,
    ProjectAudit,
} from "@/types/projectTypes";
import { getCsrfToken } from "./auth.service";
import { ApiRequestError, apiFetch } from "./index.service";

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

//Finalizacion del proyecto por parte del cliente
export async function completeProject(
    id: number,
): Promise<{ state: Project["state"]; finalized_at: string }> {
    await getCsrfToken();

    return apiFetch<{ state: Project["state"]; finalized_at: string }>(
        `/api/projects/${id}/complete/`,
        {
            method: "POST",
        },
    );
}

// Entrega por parte del tester
export async function finishProjectDelivery(
    id: number,
): Promise<{ state: Project["state"] }> {
    await getCsrfToken();

    return apiFetch<{ state: Project["state"] }>(
        `/api/projects/${id}/finish-delivery/`,
        {
            method: "POST",
        },
    );
}
// 

// Backend detail returned with 404 when the project exists but was never audited.
// apiFetch does not expose the HTTP status, so the message identifies this case.
const NO_AUDITS_DETAIL = "Este proyecto aún no tiene auditorías.";

// Latest PageSpeed Insights audit of a project, or null when there is none yet.
export async function getProjectAudit(
    projectId: number,
): Promise<ProjectAudit | null> {
    try {
        return await apiFetch<ProjectAudit>(`/api/projects/${projectId}/audit/`);
    } catch (err) {
        if (err instanceof ApiRequestError && err.data.detail === NO_AUDITS_DETAIL) {
            return null;
        }
        throw err;
    }
}

function isFailedAudit(data: unknown): data is ProjectAudit {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as { status?: unknown }).status === "FAILED" &&
        typeof (data as { id?: unknown }).id === "number"
    );
}

// Runs a new audit. PageSpeed failures come back as 502 with the stored FAILED
// audit in the body; it is returned so the caller can show its error_message.
export async function runProjectAudit(
    projectId: number,
    strategy: AuditStrategy,
): Promise<ProjectAudit> {
    await getCsrfToken();

    try {
        return await apiFetch<ProjectAudit>(`/api/projects/${projectId}/audit/`, {
            method: "POST",
            body: JSON.stringify({ strategy }),
        });
    } catch (err) {
        if (err instanceof ApiRequestError && isFailedAudit(err.data)) {
            return err.data;
        }
        throw err;
    }
}
