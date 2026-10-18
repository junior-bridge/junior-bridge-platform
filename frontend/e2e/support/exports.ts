import { type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { command, type Runtime } from "./runtime";
import { expect, responseFor, type SeedReport, type Seed } from "../fixtures/critical.fixture";
import { type ReportsPage, type ExportFormat } from "../pages/ReportsPage";

export const headers = ["ID del reporte", "ID de postulación", "Proyecto", "Título", "Descripción", "Severidad", "Estado",
    "Fecha de creación (UTC)", "Fecha de actualización (UTC)", "Pasos para reproducir", "Cantidad de evidencias"];

type Parsed = {
    format: ExportFormat; bom?: boolean; headers?: string[]; rows?: (string | number | null)[][];
    sheets?: string[]; dateCells?: boolean[]; dateFormats?: string[];
    signature?: string; pages?: number; title?: string; texts?: string[];
    pageSizes?: [number, number][]; rendered?: string[];
};

export async function downloadAndRead(page: Page, reports: ReportsPage, local: Runtime, info: TestInfo,
    format: ExportFormat, label: string, expected: SeedReport[], seed: Seed, filters: { q: string; date: string }) {
    const downloaded = page.waitForEvent("download");
    const requested = page.waitForResponse(responseFor("/api/reports/export/", "GET"));
    await reports.chooseExport(format);
    const [download, response] = await Promise.all([downloaded, requested]);
    expect(response.status()).toBe(200);
    const params = new URL(response.url()).searchParams;
    expect(params.get("file_format")).toBe(format);
    expect(params.get("q") ?? "").toBe(filters.q);
    expect(params.get("date") ?? "").toBe(filters.date);
    expect(response.headers()["x-report-count"]).toBe(String(expected.length));
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
    const path = info.outputPath(`${label}.${format}`);
    await download.saveAs(path);
    expect((await readFile(path)).length).toBeGreaterThan(100);
    await info.attach(`${label}-${format}`, { path, contentType: response.headers()["content-type"] });
    const reader = join(__dirname, "read_export.py");
    const parsed: Parsed = JSON.parse(await command(local.readerPython, [reader, path]));
    await info.attach(`${label}-${format}-lectura`, { body: JSON.stringify(parsed, null, 2), contentType: "application/json" });
    for (const image of parsed.rendered ?? []) await info.attach(`${label}-pagina`, { path: image, contentType: "image/png" });

    // Assert sobre archivos reales; no se importan los generadores de producción.
    if (format === "pdf") {
        expect(parsed.signature).toBe("%PDF");
        expect(parsed.title).toBe("Reportes de Bugs - JuniorBridge");
        expect(parsed.pages).toBeGreaterThan(0);
        for (const size of parsed.pageSizes ?? []) { expect(size[0]).toBeGreaterThan(500); expect(size[1]).toBeGreaterThan(400); }
        const text = (parsed.texts ?? []).join("\n").replace(/\s+/g, " ");
        expect(text).toContain(`Registros: ${expected.length}`);
        expect(text).toContain(seed.project.title);
        expect(text).not.toContain(seed.foreignReport.title);
        expect(text).not.toContain(seed.foreignReport._id);
        for (const report of seed.reports) {
            if (expected.some(item => item._id === report._id)) {
                expect(text).toContain(report._id);
                expect(text).toContain(report.title);
                expect(text).toContain(report.description);
                expect(text).toContain(report.steps_to_reproduce[1]);
                const date = new Date(report.created_at);
                expect(text).toContain(`${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`);
            } else { expect(text).not.toContain(report._id); expect(text).not.toContain(report.title); }
        }
    } else {
        expect(parsed.headers).toEqual(headers);
        const rows = parsed.rows ?? [];
        expect(rows).toHaveLength(expected.length);
        expect(rows.map(row => row[0]).sort()).toEqual(expected.map(report => report._id).sort());
        for (const report of expected) {
            const row = rows.find(row => row[0] === report._id)!;
            expect(row[1]).toEqual(format === "csv" ? String(seed.postulationId) : seed.postulationId);
            expect(row[2]).toBe(seed.project.title);
            expect(row[3]).toBe(report.title);
            expect(row[4]).toBe(report.description);
            expect(row[5]).toBe(report.severity === "high" ? "ALTA" : "MEDIA");
            expect(row[6]).toBe("ABIERTO");
            expect(row[9]).toBe(report.steps_to_reproduce.map((step, index) => `${index + 1}. ${step}`).join("\n"));
            expect(Number(row[10])).toBe(0);
            expect(row[8] || "").toBe("");
            const day = report.created_at.slice(0, 10);
            expect(String(row[7])).toBe(format === "xlsx" ? `${day} 12:34:56` : `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)} 12:34:56`);
        }
        expect(JSON.stringify(rows)).not.toContain(seed.foreignReport.title);
        expect(JSON.stringify(rows)).not.toContain(seed.foreignReport._id);
        if (format === "csv") expect(parsed.bom).toBe(true);
        else {
            expect(parsed.sheets).toEqual(["Reportes"]);
            expect(parsed.dateCells).toEqual(expected.map(() => true));
            expect(parsed.dateFormats?.every(format => format !== "General")).toBe(true);
        }
    }
    return parsed;
}
