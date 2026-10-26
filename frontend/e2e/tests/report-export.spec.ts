import { test, expect, evidence, responseFor } from "../fixtures/critical.fixture";
import { downloadAndRead } from "../support/exports";
import { orm } from "../support/runtime";
import { type ExportFormat } from "../pages/ReportsPage";
import { checkA11y } from "../utils/a11y";

const formats: ExportFormat[] = ["csv", "xlsx", "pdf"];

test("filtra y descarga CSV, XLSX y PDF reales sin datos ajenos", async ({ page, seed, session, reports, local }, info) => {
    // Arrange: dos reportes autorizados, otro privado y fechas UTC distintas.
    await session.loginAs("tester");
    await reports.navigate();
    await expect(reports.rows).toHaveCount(2);
    await checkA11y(page, info, "exportacion-listado-reportes");
    for (const report of seed.reports) await expect(reports.row(report.title)).toBeVisible();
    await expect(reports.row(seed.foreignReport.title)).toHaveCount(0);

    // Act / Assert: cada descarga nace en el menú real y se lee con un parser independiente.
    const query = "filtro_café_ñ";
    await reports.filter(query);
    await expect(reports.rows).toHaveCount(1);
    await checkA11y(page, info, "exportacion-filtro-texto");
    await evidence(page, info, "01-filtro-texto");
    for (const format of formats) {
        await downloadAndRead(page, reports, local, info, format, "texto", [seed.reports[0]], seed, { q: query, date: "" });
    }

    await reports.filter();
    await expect(reports.rows).toHaveCount(2);
    for (const format of formats) {
        await downloadAndRead(page, reports, local, info, format, "todos", seed.reports, seed, { q: "", date: "" });
    }

    const date = seed.reports[1].created_at.slice(0, 10);
    await reports.filter("", date);
    await expect(reports.rows).toHaveCount(1);
    await expect(reports.row(seed.reports[1].title)).toBeVisible();
    await checkA11y(page, info, "exportacion-filtro-fecha");
    await evidence(page, info, "02-filtro-fecha");
    for (const format of formats) {
        await downloadAndRead(page, reports, local, info, format, "fecha", [seed.reports[1]], seed, { q: "", date });
    }
    await reports.filter("sin-coincidencias");
    await expect(reports.rows).toHaveCount(0);
    await expect(reports.exportButton).toBeDisabled();
    await checkA11y(page, info, "exportacion-sin-coincidencias");
});

test("un usuario sin reportes tiene la exportación deshabilitada", async ({ page, session, reports, api }, info) => {
    // Arrange / Act.
    await session.loginAs("empty");
    await reports.navigate();
    // Assert.
    await expect(reports.empty).toBeVisible();
    await expect(reports.exportButton).toBeDisabled();
    await checkA11y(page, info, "exportacion-sin-reportes");
    const result = await api.get("/api/reports/");
    expect(result.status()).toBe(200);
    expect(await result.json()).toEqual([]);
    for (const format of formats) {
        const exported = await api.get(`/api/reports/export/?file_format=${format}`);
        expect(exported.status()).toBe(400);
        expect(exported.headers()["content-disposition"]).toBeUndefined();
    }
    await evidence(page, info, "sin-reportes");
});

test("un HTTP 400 real muestra el error y no genera descargas", async ({ page, session, reports, local, seed, diagnostics }, info) => {
    await session.loginAs("tester");
    await reports.navigate();
    await expect(reports.rows).toHaveCount(2);
    // Simula datos obsoletos, no una respuesta: se eliminan solo los fixtures propios en MongoDB.
    await orm(local, "remove_reports", { run: seed.run });
    const downloads: string[] = [];
    page.on("download", download => downloads.push(download.suggestedFilename()));
    diagnostics.expected("/api/reports/export/", 400);
    for (const format of formats) {
        const response = page.waitForResponse(responseFor("/api/reports/export/", "GET"));
        await reports.chooseExport(format);
        expect((await response).status()).toBe(400);
        await expect(reports.exportError).toBeVisible();
        await checkA11y(page, info, `exportacion-error-400-${format}`);
        await evidence(page, info, `error-400-${format}`);
        await reports.acceptMessage();
        await expect(reports.exportButton).toBeEnabled();
        expect(downloads).toEqual([]);
    }
});

test("sin autenticación la API rechaza exportar y la UI no descarga", async ({ page, context, session, reports, api, diagnostics }, info) => {
    await session.loginAs("tester");
    await reports.navigate();
    await expect(reports.rows).toHaveCount(2);
    await context.clearCookies();
    const downloads: string[] = [];
    page.on("download", download => downloads.push(download.suggestedFilename()));
    diagnostics.expected("/api/reports/export/", 401);
    diagnostics.expected("/api/auth/token/refresh/", 401);
    for (const format of formats) {
        const response = page.waitForResponse(responseFor("/api/reports/export/", "GET"));
        await reports.chooseExport(format);
        expect((await response).status()).toBe(401);
        await expect(reports.exportError).toBeVisible();
        await checkA11y(page, info, `exportacion-error-401-${format}`);
        await reports.acceptMessage();
        await expect(reports.exportButton).toBeEnabled();
        expect(downloads).toEqual([]);
        const rejected = await api.get(`/api/reports/export/?file_format=${format}`);
        expect(rejected.status()).toBe(401);
        expect(rejected.headers()["content-disposition"]).toBeUndefined();
    }
    await evidence(page, info, "exportacion-sin-sesion");
});
