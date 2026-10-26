import { test, expect, evidence, responseFor } from "../fixtures/critical.fixture";
import { checkA11y } from "../utils/a11y";

test("finaliza la entrega, completa el proyecto y persiste calificación y reputación", async ({ page, seed, session, projects, api, snapshot }, info) => {
    // Arrange: IN_PROGRESS, postulación aceptada y una calificación previa de otro proyecto.
    const projectId = seed.project.id;
    const path = `/api/postulations/${seed.postulationId}/rating/`;
    const comment = `${seed.run}_Excelente trabajo: café, ñ y crédito.`;
    await session.loginAs("tester");
    await projects.navigate();
    await projects.find(seed.project.title);
    await expect(projects.state(projectId, "IN_PROGRESS")).toBeVisible();
    await checkA11y(page, info, "proyecto-entrega-en-progreso");
    expect((await api.post(`/api/projects/${projectId}/complete/`)).status()).toBe(403);
    expect((await api.post(path, { stars: 4, comment })).status()).toBe(403);

    // Act / Assert: el tester entrega por UI; se verifica la transición en PostgreSQL y tras recargar.
    const delivery = page.waitForResponse(responseFor(`/api/projects/${projectId}/finish-delivery/`, "POST"));
    await projects.finishDelivery(projectId);
    expect((await delivery).status()).toBe(200);
    await expect(projects.delivered).toBeVisible();
    await expect(projects.state(projectId, "IN_REVIEW")).toBeVisible();
    expect((await snapshot()).projects.find(project => project.id === projectId)?.state).toBe("IN_REVIEW");
    await page.reload();
    await projects.find(seed.project.title);
    await expect(projects.state(projectId, "IN_REVIEW")).toBeVisible();
    await checkA11y(page, info, "proyecto-entrega-en-revision");
    await evidence(page, info, "01-entrega-en-revision");

    await session.logout();
    await session.loginAs("outsider");
    expect((await api.post(`/api/projects/${projectId}/finish-delivery/`)).status()).toBe(403);
    expect((await api.post(`/api/projects/${projectId}/complete/`)).status()).toBe(403);
    expect((await api.post(path, { stars: 4, comment })).status()).toBe(403);
    expect((await snapshot()).projects.find(project => project.id === projectId)?.state).toBe("IN_REVIEW");
    await session.logout();

    await session.loginAs("client");
    await projects.navigate();
    await projects.find(seed.project.title);
    await expect(projects.state(projectId, "IN_REVIEW")).toBeVisible();
    await checkA11y(page, info, "proyecto-cliente-en-revision");
    expect((await api.post(`/api/projects/${projectId}/finish-delivery/`)).status()).toBe(403);
    const completion = page.waitForResponse(responseFor(`/api/projects/${projectId}/complete/`, "POST"));
    await projects.complete(projectId);
    expect((await completion).status()).toBe(200);
    await expect(projects.completed).toBeVisible();
    await expect(projects.state(projectId, "COMPLETED")).toBeVisible();
    await page.reload();
    await projects.find(seed.project.title);
    await expect(projects.state(projectId, "COMPLETED")).toBeVisible();
    await checkA11y(page, info, "proyecto-completado");
    const persisted = await snapshot();
    expect(persisted.projects.find(project => project.id === projectId)).toMatchObject({ state: "COMPLETED", finalized_at: expect.any(String) });
    await evidence(page, info, "02-proyecto-completado");

    await expect(projects.ratingButton(projectId)).toBeVisible();
    await projects.openRating(projectId);
    await expect(projects.ratingDialog).toBeVisible();
    await checkA11y(page, info, "calificacion-formulario");
    await projects.fillRating(4, comment);
    await expect(projects.star(4)).toHaveAttribute("aria-pressed", "true");
    await expect(projects.star(5)).toHaveAttribute("aria-pressed", "false");
    await evidence(page, info, "03-cuatro-estrellas");
    const ratingResponse = page.waitForResponse(responseFor(path, "POST"));
    await projects.saveRating.click();
    expect((await ratingResponse).status()).toBe(201);
    await expect(projects.rated).toBeVisible();
    await expect(projects.ratingComment(projectId, comment)).toBeVisible();
    await expect(projects.ratingButton(projectId)).toHaveCount(0);
    await checkA11y(page, info, "calificacion-guardada");
    await page.reload();
    await projects.find(seed.project.title);
    await expect(projects.ratingComment(projectId, comment)).toBeVisible();
    await evidence(page, info, "04-calificacion-persistida");

    const detail = await api.get(path);
    expect(detail.status()).toBe(200);
    expect(await detail.json()).toMatchObject({ id_postulation: seed.postulationId, stars: 4, comment });
    const duplicate = await api.post(path, { stars: 5, comment: `${seed.run}_duplicado` });
    expect(duplicate.status()).toBe(400);
    expect(await duplicate.json()).toMatchObject({ detail: "This postulation already has a rating." });
    const database = await snapshot();
    const ratings = database.ratings.filter(rating => rating.id_postulation === seed.postulationId);
    expect(ratings).toHaveLength(1);
    expect(ratings[0]).toMatchObject({ stars: 4, comment });
    expect(database.expectedReputation).toBe(3); // (calificación previa 2 + nueva 4) / 2.
    expect(Number(database.testerReputation)).toBe(database.expectedReputation);
    await info.attach("persistencia-postgresql", { body: JSON.stringify(database, null, 2), contentType: "application/json" });

    await session.logout();
    await session.loginAs("tester");
    const profile = await api.get("/api/auth/profile/");
    expect(profile.status()).toBe(200);
    expect(Number((await profile.json()).reputation)).toBe(database.expectedReputation);
});
