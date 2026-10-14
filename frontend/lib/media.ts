export function getMediaUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    return apiBase ? `${apiBase}${path}` : path;
}
