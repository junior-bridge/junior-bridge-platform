import { test, expect, evidence, responseFor } from "../fixtures/critical.fixture";

test("crea un reporte real, persiste en MongoDB y respeta los permisos", async ({ page, seed, session, reports, api, snapshot }, info) => {
    // Arrange: usuarios y postulación aceptada únicos; login por UI.
    await session.loginAs("tester");
    await reports.navigate();
    const bug = {
        postulationId: seed.postulationId, title: `${seed.run}_bug_UI_café`,
        description: "El botón de crédito no responde; descripción con ñ y acentos.",
        severity: "high", steps: ["Abrir el dashboard", "Pulsar el botón", "Observar que no responde"],
    };

    // Act: formulario y POST reales, sin interceptar respuestas.
    await reports.openForm();
    await expect(reports.dialog).toBeVisible();
    await expect(reports.postulation).toBeVisible();
    await reports.fillForm(bug);
    await expect(reports.postulation).toHaveValue(String(seed.postulationId));
    await evidence(page, info, "01-formulario-reporte");
    const createdResponse = page.waitForResponse(responseFor(`/api/postulations/${seed.postulationId}/reports/`, "POST"));
    await reports.submit.click();
    const response = await createdResponse;

    // Assert: 201, UI, recarga, API y documento real de MongoDB.
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created).toMatchObject({ title: bug.title, description: bug.description, severity: "high", id_postulation: seed.postulationId, steps_to_reproduce: bug.steps });
    await expect(reports.success).toBeVisible();
    await evidence(page, info, "02-reporte-creado");
    await reports.acceptMessage();
    await expect(reports.row(bug.title)).toBeVisible();
    await page.reload();
    await expect(reports.row(bug.title)).toBeVisible();
    const detail = await api.get(`/api/reports/${created._id}/`);
    expect(detail.status()).toBe(200);
    expect(await detail.json()).toMatchObject({ _id: created._id, title: bug.title });
    const database = await snapshot();
    expect(database.reports.filter(report => report._id === created._id)).toHaveLength(1);
    expect(database.reports.find(report => report._id === created._id)).toMatchObject({ title: bug.title, steps_to_reproduce: bug.steps });
    await info.attach("persistencia-mongodb", { body: JSON.stringify(database.reports, null, 2), contentType: "application/json" });

    await session.logout();
    await session.loginAs("client");
    await reports.navigate();
    await expect(reports.row(bug.title)).toBeVisible();
    expect((await api.get(`/api/reports/${created._id}/`)).status()).toBe(200);
    await evidence(page, info, "03-reporte-cliente");

    await session.logout();
    await session.loginAs("outsider");
    await reports.navigate();
    await expect(reports.row(seed.foreignReport.title)).toBeVisible();
    await expect(reports.row(bug.title)).toHaveCount(0);
    expect((await api.get(`/api/reports/${created._id}/`)).status()).toBe(403);
    expect((await api.get(`/api/postulations/${seed.postulationId}/reports/`)).status()).toBe(403);
    const own = await api.get("/api/reports/");
    expect(own.status()).toBe(200);
    expect((await own.json()).map((report: { _id: string }) => report._id)).not.toContain(created._id);
    await evidence(page, info, "04-permisos-ajeno");
});
