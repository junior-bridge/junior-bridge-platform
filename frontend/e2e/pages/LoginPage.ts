
import { type Locator, type Page } from "@playwright/test";

export class LoginPage {
    private readonly page: Page;
    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly submitButton: Locator;
    private readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByLabel("Correo Electrónico");
        this.passwordInput = page.getByLabel("Contraseña");
        this.submitButton = page.getByRole("button", {
            name: "Iniciar Sesion",
        });
        this.errorMessage = page.getByText(
            "Las credenciales son inválidas.",
            { exact: true },
        );
    }

    async navigate(): Promise<LoginPage> {
        await this.page.goto("/login");
        return this;
    }

    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async getErrorText(): Promise<string | null> {
        await this.errorMessage.waitFor({ state: "visible" });
        return this.errorMessage.textContent();
    }
}
