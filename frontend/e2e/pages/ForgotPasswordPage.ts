import { type Locator, type Page } from "@playwright/test";

export class ForgotPasswordPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.locator("#email");
        this.submitButton = page.getByRole("button", {
            name: /Enviar enlace de recuperaci/,
        });
    }

    async navigate() {
        await this.page.goto("/forgot-password");
    }
}
