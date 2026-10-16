import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/RegisterPage";

test.describe("Registro", () => {
    test("muestra los campos obligatorios para emprendedores", async ({ page }) => {
        const registerPage = new RegisterPage(page);

        await registerPage.navigate();

        await expect(registerPage.nameInput).toBeVisible();
        await expect(registerPage.surnameInput).toBeVisible();
        await expect(registerPage.emailInput).toBeVisible();
        await expect(registerPage.passwordInput).toBeVisible();
        await expect(registerPage.confirmPasswordInput).toBeVisible();
        await expect(registerPage.termsCheckbox).toBeVisible();
        await expect(registerPage.submitButton).toBeVisible();

        await expect(registerPage.nameInput).toHaveAttribute("required", "");
        await expect(registerPage.emailInput).toHaveAttribute("required", "");
        await expect(registerPage.passwordInput).toHaveAttribute("required", "");
    });

    test("muestra las opciones de registro para Tester Junior", async ({ page }) => {
        const registerPage = new RegisterPage(page);

        await registerPage.navigate();
        await registerPage.testerRoleButton.click();

        await expect(
            page.getByText("Registro como Tester Junior")
        ).toBeVisible();

        await expect(registerPage.submitButton).toHaveCount(0);
        await expect(
            page.getByRole("button", { name: /Contin.*con Google/i })
        ).toBeVisible();
        await expect(
            page.getByRole("button", { name: /Contin.*con GitHub/i })
        ).toBeVisible();
    });
});
