import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("Inicio de sesión", () => {
    test("muestra los campos y el botón para iniciar sesión", async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.navigate();

        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.submitButton).toBeVisible();
    });

    test("impide enviar el formulario con campos vacíos", async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.navigate();
        await loginPage.submitButton.click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(loginPage.emailInput).toBeVisible();
    });
});
