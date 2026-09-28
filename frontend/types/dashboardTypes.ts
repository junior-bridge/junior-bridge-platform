import { AdminProject, ProjectState } from "@/lib/api";

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