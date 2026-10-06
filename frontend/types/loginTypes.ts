export type LoginErrors = Partial<Record<"email" | "password", string>>;

export type LoginData = {
    email: string;
    password: string;
};