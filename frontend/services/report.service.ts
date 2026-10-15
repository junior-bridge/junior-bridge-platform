import { CreateReportData, Report } from "@/types/reportTypes";
import { apiFetch } from "./index.service";
import { clearCsrfToken, getCsrfToken } from "@/lib/csrf";
import { API_BASE } from "@/lib/apiBase";

export async function getReports(): Promise<Report[]> {
    return apiFetch<Report[]>("/api/reports/");
}

const exportMimeTypes: Record<ReportExportFormat, string> = {
    csv: "text/csv",
    pdf: "application/pdf",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function downloadReports(
    format: ReportExportFormat,
    filters: ReportExportFilters,
    expectedCount: number,
): Promise<void> {
    const params = new URLSearchParams({ file_format: format, ...filters });
    const url = `${API_BASE}/api/reports/export/?${params}`;
    const request = async () => {
        try {
            return await fetch(url, { credentials: "include", cache: "no-store" });
        } catch {
            throw new Error("No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.");
        }
    };
    let response = await request();
    if (response.status === 401) {
        try {
            await getCsrfToken();
            await refreshToken();
        } catch {
            throw new Error("Tu sesión expiró. Iniciá sesión nuevamente para exportar.");
        }
        response = await request();
    }
    if (response.status === 401) {
        throw new Error("Tu sesión expiró. Iniciá sesión nuevamente para exportar.");
    }
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(typeof error?.detail === "string"
            ? error.detail : "No se pudo exportar. Revisá los filtros e intentá nuevamente.");
    }
    if (response.headers.get("Content-Type")?.split(";")[0] !== exportMimeTypes[format]) {
        throw new Error("El servidor no devolvió un archivo válido. No se inició la descarga.");
    }
    const count = response.headers.get("X-Report-Count");
    if (count === null || Number(count) !== expectedCount) {
        throw new Error("El listado cambió. Actualizá los reportes antes de volver a exportar.");
    }
    const blob = await response.blob();
    const contentLength = response.headers.get("Content-Length");
    if (contentLength !== null && Number(contentLength) !== blob.size) {
        throw new Error("El archivo recibido está incompleto. Intentá nuevamente.");
    }
    const prefix = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
    const tail = new Uint8Array(await blob.slice(-1024).arrayBuffer());
    const valid = format === "pdf"
        ? new TextDecoder().decode(prefix).startsWith("%PDF-") && new TextDecoder().decode(tail).includes("%%EOF")
        : format === "xlsx"
            ? prefix[0] === 0x50 && prefix[1] === 0x4b && prefix[2] === 3 && prefix[3] === 4
                && tail[tail.length - 22] === 0x50 && tail[tail.length - 21] === 0x4b
                && tail[tail.length - 20] === 5 && tail[tail.length - 19] === 6
            : prefix[0] === 0xef && prefix[1] === 0xbb && prefix[2] === 0xbf
                && new TextDecoder().decode(prefix.slice(3)).startsWith("ID del reporte;");
    if (!valid) {
        throw new Error("El archivo recibido está vacío o es inválido. No se inició la descarga.");
    }
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = disposition.match(/filename="(reportes-juniorbridge-\d{8}-\d{6}\.(?:csv|pdf|xlsx))"/)?.[1];
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    try {
        link.href = objectUrl;
        link.download = filename?.endsWith(`.${format}`) ? filename : `reportes-juniorbridge.${format}`;
        document.body.appendChild(link);
        link.click();
    } finally {
        link.remove();
        // Give the browser time to consume the URL before releasing its memory.
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
}

export async function createReport(
    postulationId: number,
    data: CreateReportData,
): Promise<Report> {
    const csrfToken = await getCsrfToken();
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("severity", data.severity);
    formData.append("steps_to_reproduce", JSON.stringify(data.steps_to_reproduce));

    for (const image of data.evidence_images ?? []) {
        formData.append("evidence_images", image);
    }

    let response: Response;
    try {
        response = await fetch(
            `${API_BASE}/api/postulations/${postulationId}/reports/`,
            {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrfToken,
                },
                credentials: "include",
                body: formData,
            },
        );
    } finally {
        clearCsrfToken();
    }

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
