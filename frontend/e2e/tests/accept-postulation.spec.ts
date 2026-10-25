
import { test, expect } from "@playwright/test";
import { checkA11y } from "../utils/a11y";

test("el cliente acepta una postulación pendiente", async ({ page }, testInfo) => {
    const postulation = {
        id_postulation: 25,
        id_project: 10,
        id_tester: 20,
        tester_name: "Tester E2E",
        tester_email: "tester.e2e@example.com",
        project_title: "Proyecto E2E",
        postulation_date: "2026-10-15T10:00:00Z",
        status: "pending",
    };

    const client = {
        id: 1,
        name: "Cliente E2E",
        surname: "Prueba",
        email: "cliente.e2e@example.com",
        role: "CLIENT",
    };

    let accepted = false;

    await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;

        console.log("Solicitud API E2E:", request.method(), path);

        if (path.endsWith("/api/auth/profile/")) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(client),
            });
            return;
        }

        if (path.endsWith("/api/auth/csrf/")) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ csrfToken: "csrf-token-e2e" }),
            });
            return;
        }
   if (path === "/api/projects/user-active/") {
    await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
            { id: 10, title: "Proyecto E2E" },
        ]),
    });
    return;
}

        if (path === "/api/projects/10/postulations/") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([
                    accepted
                        ? { ...postulation, status: "accepted" }
                        : postulation,
                ]),
            });
            return;
        }

        if (
            path === "/api/postulations/25/accept/" &&
            request.method() === "POST"
        ) {
            accepted = true;

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    ...postulation,
                    status: "accepted",
                }),
            });
            return;
        }

        // Las demás API se registran en consola para detectar
        // endpoints que necesitemos simular.
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
        });
    });

    await page.goto("/dashboard/postulations");

    await expect(page.getByText("Tester E2E")).toBeVisible();
    await expect(page.getByText("PENDIENTE")).toBeVisible();
    await checkA11y(page, testInfo, "postulacion-pendiente");

    await page.getByRole("button", { name: "Aceptar" }).click();

    await expect(page.getByText("ACEPTADO")).toBeVisible();
    await checkA11y(page, testInfo, "postulacion-aceptada");
});
