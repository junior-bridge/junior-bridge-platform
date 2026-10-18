import { type Locator, type Page } from "@playwright/test";

export class RegisterPage {
    readonly page: Page;
    readonly nameInput: Locator;
    readonly surnameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly termsCheckbox: Locator;
    readonly submitButton: Locator;
    readonly testerRoleButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.nameInput = page.locator("#name");
        this.surnameInput = page.locator("#surname");
        this.emailInput = page.locator("#email");
        this.passwordInput = page.locator("#password");
        this.confirmPasswordInput = page.locator("#confirmPassword");
        this.termsCheckbox = page.locator('input[type="checkbox"]');
        this.submitButton = page.getByRole("button", {
            name: "Crear cuenta",
        });
        this.testerRoleButton = page.getByRole("button", {
            name: "Tester Junior",
        });
    }

    async navigate() {
        await this.page.goto("/register");
    }
}
