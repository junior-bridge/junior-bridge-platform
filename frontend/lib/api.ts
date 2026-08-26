// SHARED API CLIENT

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiError = {
    detail?: string;
    [key: string]: unknown;
};

type User = {
    id: number;
    email: string;
    name: string;
    surname: string;
    dni: string | null;
    phone: string;
    sex: string;
    date_of_birth: string | null;
    zona: string;
    role: "CLIENT" | "TESTER" | "ADMIN";
    reputation: string;
    date_joined: string;
    created_at: string;
    updated_at: string;
};

type AuthResponse = {
    user: User;
};

function getCookie(name: string): string | null {
    if (typeof document === "undefined") {
        return null;
    }

    const cookies = document.cookie.split("; ");

    for (const cookie of cookies) {
        const [key, ...value] = cookie.split("=");

        if (key === name) {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
}

export async function getCsrfToken(): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/csrf/`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("No se pudo obtener el token CSRF.");
    }
}

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const method = options.method?.toUpperCase() ?? "GET";

    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const csrfToken = getCookie("csrftoken");

        if (!csrfToken) {
            throw new Error("No se encontró el token CSRF.");
        }

        headers.set("X-CSRFToken", csrfToken);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        let error: ApiError = {
            detail: "Ocurrió un error inesperado.",
        };

        try {
            error = await response.json();
        } catch {}

        if (
            Array.isArray(error.email) &&
            error.email.some(
                (message) =>
                    typeof message === "string" &&
                    message.toLowerCase().includes("already exists"),
            )
        ) {
            throw new Error(
                "Ya existe un usuario registrado con ese correo electrónico.",
            );
        }

        throw new Error(
            typeof error.detail === "string"
                ? error.detail
                : "No se pudo completar la solicitud.",
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

// AUTHENTICATION

export type RegisterData = {
    email: string;
    password: string;
    name: string;
    surname: string;
};

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
    await getCsrfToken();

    try {
        return await apiFetch<AuthResponse>("/api/auth/register/", {
            method: "POST",
            body: JSON.stringify(data),
        });
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.toLowerCase().includes("already exists") ||
                error.message.toLowerCase().includes("already registered") ||
                error.message.toLowerCase().includes("duplicate"))
        ) {
            throw new Error(
                "Ya existe un usuario registrado con ese correo electrónico.",
            );
        }

        throw error;
    }
}

export type LoginData = {
    email: string;
    password: string;
};

export async function loginUser(data: LoginData): Promise<AuthResponse> {
    await getCsrfToken();

    return apiFetch<AuthResponse>("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export type OAuthProvider = "google" | "github";
export type OAuthProcess = "signup" | "login";
export type OAuthFlow = "entrepreneur" | "tester";

type OAuthStartResponse = {
    login_url: string;
};

export async function startOAuth(
    provider: OAuthProvider,
    process: OAuthProcess,
    flow?: OAuthFlow,
): Promise<OAuthStartResponse> {
    await getCsrfToken();

    return apiFetch<OAuthStartResponse>(`/api/auth/oauth/${provider}/start/`, {
        method: "POST",
        body: JSON.stringify({
            process,
            ...(flow ? { flow } : {}),
        }),
    });
}

export async function getProfile(): Promise<User> {
    return apiFetch<User>("/api/auth/profile/");
}

export async function logoutUser(): Promise<void> {
    await apiFetch("/api/auth/logout/", {
        method: "POST",
    });
}

export async function refreshToken(): Promise<void> {
    await apiFetch("/api/auth/token/refresh/", {
        method: "POST",
    });
}

export type { User, AuthResponse };

// PROJECTS

export type ProjectModality = "REMOTE" | "ON_SITE" | "HYBRID";

export type ProjectState =
  | "PENDING"
  | "OPEN"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "COMPLETED"
  | "REJECTED";

export type CreateProjectData = {
    title: string;
    description: string;
    repository: string;
    demo_url: string;
    technologies: string;
    modality: ProjectModality;
};

export type Project = CreateProjectData & {
    id: number;
    state:
        | "PENDING"
        | "OPEN"
        | "IN_PROGRESS"
        | "IN_REVIEW"
        | "COMPLETED"
        | "REJECTED";
    client: number;
    created_at: string;
    updated_at: string;
    finalized_at: string | null;
};

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

// =============================================================================
// POSTULATIONS
// =============================================================================

export type Postulation = {
    id_postulation: number;
    id_project: number;
    id_tester: number;
    project_title?: string;
    tester_name?: string;
    tester_email?: string;
    tester_reputation?: string;
    status: "pending" | "accepted" | "rejected";
    postulation_date: string;
};

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

// =============================================================================
// REPORTS
// =============================================================================

export type Report = {
    id_report: number;
    id_postulation: number;
    title: string;
    description: string;
    risk_level: string;
    capture_evidence: string | null;
    state: "PENDING" | "REVIEW" | "CLOSED";
    created_at: string;
    updated_at: string;
};

export type CreateReportData = {
    title: string;
    description: string;
    risk_level: string;
    capture_evidence?: File;
};

export async function getReports(): Promise<Report[]> {
    return apiFetch<Report[]>("/api/reports/");
}

export async function createReport(
    postulationId: number,
    data: CreateReportData,
): Promise<Report> {
    await getCsrfToken();

    const csrfToken = getCookie("csrftoken") ?? "";
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("risk_level", data.risk_level);

    if (data.capture_evidence) {
        formData.append("capture_evidence", data.capture_evidence);
    }

    const response = await fetch(
        `${API_URL}/api/postulations/${postulationId}/reports/`,
        {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: formData,
        },
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail ?? "No se pudo crear el reporte.");
    }

    return response.json();
}

export async function getPostulationReports(
    postulationId: number,
): Promise<Report[]> {
    return apiFetch<Report[]>(`/api/postulations/${postulationId}/reports/`);
}

export async function getReport(id: number): Promise<Report> {
    return apiFetch<Report>(`/api/reports/${id}/`);
}

export async function updateReport(
    id: number,
    data: Partial<CreateReportData>,
): Promise<Report> {
    await getCsrfToken();

    return apiFetch<Report>(`/api/reports/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteReport(id: number): Promise<void> {
    await getCsrfToken();

    return apiFetch<void>(`/api/reports/${id}/`, {
        method: "DELETE",
    });
}

// =============================================================================
// RATINGS
// =============================================================================

export type Rating = {
    id_rating: number;
    id_postulation: number;
    stars: number;
    comment: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateRatingData = {
    stars: number;
    comment?: string;
};

export async function createRating(
    postulationId: number,
    data: CreateRatingData,
): Promise<Rating> {
    await getCsrfToken();
    return apiFetch<Rating>(`/api/postulations/${postulationId}/rating/`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getRating(postulationId: number): Promise<Rating> {
    return apiFetch<Rating>(`/api/postulations/${postulationId}/rating/`);
}

export async function updateRating(
    ratingId: number,
    data: CreateRatingData,
): Promise<Rating> {
    await getCsrfToken();
    return apiFetch<Rating>(`/api/rating/${ratingId}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export type ProjectClient = {
  id: number;
  name: string;
  surname: string;
  email: string;
};

export type AdminProject = CreateProjectData & {
  id: number;
  state: ProjectState;
  client: ProjectClient;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
};

export async function getProjects(): Promise<AdminProject[]> {
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
