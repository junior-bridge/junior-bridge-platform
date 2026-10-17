import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test("el usuario inicia sesión y accede al dashboard", async ({ page }) => {
    const user = {
        id: 1,
        name: "Cliente E2E",
        surname: "Prueba",
        email: "cliente.e2e@example.com",
        role: "CLIENT",
    };

    // Diagnósticos del navegador.
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            console.log("[BROWSER ERROR]", msg.text());
        }
    });

    page.on("pageerror", (error) => {
        console.log("[PAGE ERROR]", error.message);
    });

    page.on("requestfailed", (request) => {
        console.log(
            "[REQUEST FAILED]",
            request.method(),
            request.url(),
            request.failure()?.errorText
        );
    });

    page.on("response", (response) => {
        if (response.url().includes("localhost:8000")) {
            console.log(
                "[HTTP RESPONSE]",
                response.status(),
                response.request().method(),
                response.url()
            );
        }
    });

    page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame()) {
            console.log("[NAVIGATION]", frame.url());
        }
    });

    // Simula las respuestas HTTP del backend.
    await page.route("http://localhost:8000/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;

        if (path === "/api/auth/csrf/") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    csrfToken: "csrf-token-e2e",
                }),
            });
            return;
        }

        if (path === "/api/auth/login/") {
            console.log("[LOGIN REQUEST]", request.url());
            console.log("[LOGIN BODY]", request.postData());

            if (request.method() !== "POST") {
                await route.fulfill({
                    status: 405,
                    contentType: "application/json",
                    body: JSON.stringify({
                        detail: "Method not allowed",
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    user,
                    access: "token-e2e",
                    refresh: "refresh-token-e2e",
                }),
            });
            return;
        }

        if (path === "/api/auth/profile/") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(user),
            });
            return;
        }

        // Respuesta genérica para los demás endpoints HTTP.
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
        });
    });

    // Preparación del formulario.
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.emailInput.fill(user.email);
    await loginPage.passwordInput.fill("PasswordE2E123!");

    // Inicio de sesión.
    await loginPage.submitButton.click();

    // Espera a que se complete la navegación al dashboard.
    await expect(page).toHaveURL(/\/dashboard\/?$/, {
        timeout: 10_000,
    });

    // Verifica que el dashboard se haya renderizado.
    await expect(
        page.getByText("Hola, Cliente E2E")
    ).toBeVisible();

    console.log("[URL FINAL]", page.url());
});