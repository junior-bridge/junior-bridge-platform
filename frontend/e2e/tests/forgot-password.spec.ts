import { test, expect } from "@playwright/test";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";

test.describe("Recuperación de contraseña", () => {
    test("muestra el formulario de recuperación", async ({ page }) => {
        const forgotPage = new ForgotPasswordPage(page);

        await forgotPage.navigate();

        await expect(forgotPage.emailInput).toBeVisible();
        await expect(forgotPage.emailInput).toHaveAttribute("required", "");
        await expect(forgotPage.submitButton).toBeVisible();
        await expect(
            page.getByRole("link", { name: /Volver al inicio de sesi/ })
        ).toBeVisible();
    });

    test("no envía el formulario con el correo vacío", async ({ page }) => {
        const forgotPage = new ForgotPasswordPage(page);

        await forgotPage.navigate();
        await forgotPage.submitButton.click();

        await expect(page).toHaveURL(/\/forgot-password$/);
        await expect(forgotPage.emailInput).toBeVisible();
        await expect(forgotPage.emailInput).toHaveValue("");
    });
});
