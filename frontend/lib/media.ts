import { API_BASE } from "./apiBase";

export function getMediaUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    return `${API_BASE}${path}`;
}
