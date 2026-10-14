export type Report = {
    _id: string;
    id_postulation: number;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    steps_to_reproduce: string[];
    capture_evidence?: string | null;
    evidence_images?: string[];
    created_at: string;
    state?: "PENDING" | "REVIEW" | "CLOSED";
    updated_at?: string;
};

export type CreateReportData = {
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    steps_to_reproduce: string[];
    evidence_images?: File[];
};