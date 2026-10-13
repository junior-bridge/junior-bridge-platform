
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

export type AuditStrategy = "MOBILE" | "DESKTOP";

export type AuditStatus = "SUCCESS" | "FAILED";

export type ProjectAudit = {
    id: number;
    strategy: AuditStrategy;
    status: AuditStatus;
    performance: number | null;
    accessibility: number | null;
    best_practices: number | null;
    seo: number | null;
    error_message: string;
    created_at: string;
};
