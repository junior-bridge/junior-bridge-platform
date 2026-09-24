import { CreateReportData } from "@/types/reportTypes";
import { apiFetch } from "./index.service";
import { getCookie, getCsrfToken } from "./auth.service";

export async function getReports(): Promise<Report[]> {
    return apiFetch<Report[]>("/api/reports/");
}

export async function createReport(
    postulationId: number,
    data: CreateReportData,
): Promise<Report> {
    await getCsrfToken();

    const csrfToken = getCookie("csrftoken") ?? "";
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("severity", data.severity);
    formData.append("steps_to_reproduce", JSON.stringify(data.steps_to_reproduce));

    if (data.capture_evidence) {
        formData.append("capture_evidence", data.capture_evidence);
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/postulations/${postulationId}/reports/`,
        {
            method: "POST",
            headers: {
                "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: formData,
        },
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));

        let errorMessage = err.detail;

        if (!errorMessage && typeof err === "object" && err !== null) {
            const messages = Object.entries(err)
                .map(
                    ([key, val]) =>
                        `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
                )
                .join(" | ");
            if (messages) errorMessage = messages;
        }

        throw new Error(errorMessage ?? "No se pudo crear el reporte.");
    }

    return response.json();
}

export async function getPostulationReports(
    postulationId: number,
): Promise<Report[]> {
    return apiFetch<Report[]>(`/api/postulations/${postulationId}/reports/`);
}

export async function getReport(id: number): Promise<Report> {
    return apiFetch<Report>(`/api/reports/${id}/`);
}

export async function updateReport(
    id: number,
    data: Partial<CreateReportData>,
): Promise<Report> {
    await getCsrfToken();

    return apiFetch<Report>(`/api/reports/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteReport(id: number): Promise<void> {
    await getCsrfToken();

    return apiFetch<void>(`/api/reports/${id}/`, {
        method: "DELETE",
    });
}