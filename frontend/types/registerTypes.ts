export type RegisterField ="name"| "surname"| "email"| "password"| "confirmPassword";

export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export type RegisterData = {
    email: string;
    password: string;
    name: string;
    surname: string;
};