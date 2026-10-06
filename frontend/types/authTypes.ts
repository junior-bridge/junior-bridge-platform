import {User} from "@/types/index"
export type AuthResponse = {
    user: User;
};

export type OAuthProvider = "google" | "github";
export type OAuthProcess = "signup" | "login";
export type OAuthFlow = "entrepreneur" | "tester";

export type OAuthStartResponse = {
    login_url: string;
};
