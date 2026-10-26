import { DashboardPage } from "../pages/DashboardPage";
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { checkA11y } from "../utils/a11y";


test("TC-L-01: Inicio de sesión exitoso con credenciales válidas", async ({ page }, testInfo) => {
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

    // Preparación e inicio de sesión.
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await checkA11y(page, testInfo, "login-formulario");
    await loginPage.login(user.email, "PasswordE2E123!");

    // Verifica que se acceda al dashboard.
    await expect(page).toHaveURL(/\/dashboard\/?$/, {
        timeout: 10_000,
    });

    // Verifica el saludo mediante el Page Object del dashboard.
    const dashboardPage = new DashboardPage(page);

    await expect(
        await dashboardPage.getGreetingText()
    ).toContain("Hola, Cliente E2E");
    await checkA11y(page, testInfo, "dashboard-cliente");

    console.log("[URL FINAL]", page.url());
});


const invalidLoginCases = [
    {
        description: "correo de Barbie con la contraseña indicada",
        email: "barbie@gmail.com",
        password: "Barbie123!",
    },
    {
        description: "correo de cliente no válido con su contraseña indicada",
        email: "client-novalido@juniorbridge.test",
        password: "Clientnovalid123!",
    },
    {
        description: "correo inexistente",
        email: "usuario-inexistente.e2e@example.com",
        password: "PasswordE2E123!",
    },
    {
        description: "contraseña incorrecta",
        email: "cliente.e2e@example.com",
        password: "WrongPasswordE2E123!",
    },
];

for (const scenario of invalidLoginCases) {
    test(
        `TC-L-02: Rechaza credenciales inválidas - ${scenario.description}`,
        async ({ page }, testInfo) => {
            await page.route("http://localhost:8000/**", async (route) => {
                const request = route.request();
                const path = new URL(request.url()).pathname;

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
                    expect(request.method()).toBe("POST");

                    const body = request.postDataJSON() as {
                        email: string;
                        password: string;
                    };

                    expect(body.email).toBe(scenario.email);
                    expect(body.password).toBe(scenario.password);

                    await route.fulfill({
                        status: 400,
                        contentType: "application/json",
                        body: JSON.stringify({
                            detail: "Las credenciales son inválidas.",
                        }),
                    });
                    return;
                }

                // Si el login falla, no debería ser necesario consultar
                // el perfil autenticado.
                if (path === "/api/auth/profile/") {
                    await route.fulfill({
                        status: 401,
                        contentType: "application/json",
                        body: JSON.stringify({
                            detail: "No autenticado.",
                        }),
                    });
                    return;
                }

                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([]),
                });
            });

            const loginPage = new LoginPage(page);

            await loginPage.navigate();
            await loginPage.login(scenario.email, scenario.password);

            await expect(page).toHaveURL(/\/login\/?$/);

            await expect(
                await loginPage.getErrorText(),
            ).toBe("Las credenciales son inválidas.");

            await expect(page).not.toHaveURL(/\/dashboard\/?$/);
            await checkA11y(page, testInfo, "login-credenciales-invalidas");
        },
    );
}