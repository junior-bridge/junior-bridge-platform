export type ApiError = {
    detail?: string;
    [key: string]: unknown;
};

export type User = {
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