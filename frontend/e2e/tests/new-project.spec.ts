
import { test, expect, type Page } from "@playwright/test";
import { NewProjectPage } from "../pages/NewProjectPage";

async function mockAuthenticatedClient(page: Page) {
    await page.route("**/api/auth/profile/", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                id: 1,
                email: "cliente.e2e@example.com",
                name: "Cliente",
                surname: "Prueba",
                dni: null,
                phone: "",
                sex: "",
                date_of_birth: null,
                zona: "",
                profile_photo: null,
                role: "CLIENT",
                reputation: "0.00",
                date_joined: "2026-01-01T00:00:00Z",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
            }),
        });
    });

    await page.route("**/api/auth/csrf/", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ csrfToken: "csrf-token-e2e" }),
        });
    });
}

test.describe("Publicación de proyectos", () => {
    test("muestra los campos del formulario", async ({ page }) => {
        await mockAuthenticatedClient(page);

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();

        await expect(projectPage.titleInput).toBeVisible();
        await expect(projectPage.descriptionInput).toBeVisible();
        await expect(projectPage.repositoryInput).toBeVisible();
        await expect(projectPage.demoUrlInput).toBeVisible();
        await expect(projectPage.technologiesInput).toBeVisible();
        await expect(projectPage.modalitySelect).toBeVisible();
        await expect(projectPage.submitButton).toBeVisible();
    });

    test("impide publicar con campos obligatorios vacíos", async ({ page }) => {
        await mockAuthenticatedClient(page);

        let projectRequestSent = false;

        await page.route("**/api/projects/", async (route) => {
            if (route.request().method() === "POST") {
                projectRequestSent = true;
            }

            await route.continue();
        });

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();
        await projectPage.submitButton.click();

        await expect(projectPage.titleInput).toBeVisible();
        await expect(page).toHaveURL(/\/dashboard\/projects\/new$/);

        expect(projectRequestSent).toBe(false);
    });

    test("rechaza una URL de repositorio inválida", async ({ page }) => {
        await mockAuthenticatedClient(page);

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();
        await projectPage.fillValidForm();
        await projectPage.repositoryInput.fill(
            "https://ejemplo.org/repositorio"
        );
        await projectPage.submitButton.click();

        const repositoryError =
            projectPage.repositoryInput.locator("xpath=following-sibling::span");

        await expect(repositoryError).toHaveClass(/text-red-500/);
        await expect(repositoryError).toContainText("comience con http");
    });

    test("muestra confirmación cuando la API crea el proyecto", async ({ page }) => {
        await mockAuthenticatedClient(page);

        let submittedProject: Record<string, unknown> | null = null;

        await page.route("**/api/projects/", async (route) => {
            if (route.request().method() !== "POST") {
                await route.continue();
                return;
            }

            submittedProject = route.request().postDataJSON();

            await route.fulfill({
                status: 201,
                contentType: "application/json",
                body: JSON.stringify({
                    id: 101,
                    ...submittedProject,
                    state: "PENDING",
                    client: 1,
                    created_at: "2026-01-01T00:00:00Z",
                    updated_at: "2026-01-01T00:00:00Z",
                    finalized_at: null,
                }),
            });
        });

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();
        await projectPage.fillValidForm();
        await projectPage.submitButton.click();

        await expect(
            page.getByRole("heading", { name: "Proyecto creado" })
        ).toBeVisible();

        expect(submittedProject).toMatchObject({
            title: "Proyecto de prueba E2E",
            modality: "REMOTE",
        });

        await page.getByRole("button", { name: "Aceptar" }).click();

        await expect(page).toHaveURL(/\/dashboard\/projects$/);
    });

    test("informa cuando falla la creación del proyecto", async ({ page }) => {
        await mockAuthenticatedClient(page);

        await page.route("**/api/projects/", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 500,
                    contentType: "application/json",
                    body: JSON.stringify({
                        detail: "Error interno de prueba",
                    }),
                });
                return;
            }

            await route.continue();
        });

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();
        await projectPage.fillValidForm();
        await projectPage.submitButton.click();

        await expect(
            page.getByText("No se pudo crear el proyecto")
        ).toBeVisible();
    });

    test("el proyecto creado aparece en el listado del cliente", async ({ page }) => {
        await mockAuthenticatedClient(page);

        const createdProject = {
            id: 101,
            title: "Proyecto de prueba E2E",
            description: "Proyecto creado durante una prueba automatizada",
            repository_url: "https://github.com/usuario/proyecto",
            demo_url: "",
            technologies: "Python, Django",
            modality: "REMOTE",
            state: "PENDING",
            client: 1,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
            finalized_at: null,
        };

        // Simulamos la creación del proyecto.
        await page.route("**/api/projects/", async (route) => {
            if (route.request().method() === "POST") {
                await route.fulfill({
                    status: 201,
                    contentType: "application/json",
                    body: JSON.stringify(createdProject),
                });
                return;
            }

            await route.continue();
        });

        // Simulamos el listado de proyectos del cliente.
        await page.route("**/api/projects/user-active/", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([createdProject]),
            });
        });

        const projectPage = new NewProjectPage(page);

        await projectPage.navigate();
        await projectPage.fillValidForm();
        await projectPage.submitButton.click();

        await expect(
            page.getByRole("heading", { name: "Proyecto creado" })
        ).toBeVisible();

        await page.getByRole("button", { name: "Aceptar" }).click();

        await expect(page).toHaveURL(/\/dashboard\/projects$/);

        // Verificamos que el proyecto aparezca en el listado.
        await expect(
            page.getByRole("heading", {
                name: "Proyecto de prueba E2E",
            })
        ).toBeVisible();
    });
});
