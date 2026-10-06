import { AdminProject, ProjectState } from "@/types/projectTypes";

export interface UserDashboard {
    id: string;
    name: string;
    email: string;
    role: "TESTER" | "CLIENT" | "ADMIN";
    status: "activo" | "pendiente" | "suspendido";
    joined: string;
    projects: number;
    reputation: string;
}
export interface AdminUser {
    id: number;
    name: string;
    surname: string;
    email: string;
    role: "TESTER" | "CLIENT" | "ADMIN";
    is_active: boolean;
    created_at: string;
    projects_count: number;
    reputation: string;
}

type ReportFormField ="postulationId"| "title"| "description"| "stepsToReproduce";
export type ReportFormErrors = Partial<Record<ReportFormField, string>>;

export type ProjectFilter = ProjectState | "ALL";

export type PendingAction = {
    project: AdminProject;
    state: "OPEN" | "REJECTED";
};


export type ProjectForm = {
    title: string;
    description: string;
    repository: string;
    demo_url: string;
    technologies: string;
    modality: string;
};

export type ProjectFormErrors = Partial<Record<keyof ProjectForm, string>>;