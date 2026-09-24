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