// =============================================================================
// SHARED API CLIENT
// =============================================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    } catch {
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

// =============================================================================
// AUTHENTICATION
// =============================================================================

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  surname: string;
};

export async function registerUser(
  data: RegisterData,
): Promise<AuthResponse> {
  await getCsrfToken();

  return apiFetch<AuthResponse>("/api/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export type LoginData = {
  email: string;
  password: string;
};

export async function loginUser(
  data: LoginData,
): Promise<AuthResponse> {
  await getCsrfToken();

  return apiFetch<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(data),
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

// =============================================================================
// PROJECTS
// =============================================================================

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
  state: ProjectState;
  client: number;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
};

export async function createProject(
  data: CreateProjectData,
): Promise<Project> {
  await getCsrfToken();

  return apiFetch<Project>("/api/projects/", {
    method: "POST",
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
