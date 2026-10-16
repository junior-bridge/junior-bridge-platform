import { type Locator, type Page } from "@playwright/test";
import { LoginPage } from "./LoginPage";

// Agrega logout al LoginPage oficial, sin duplicar sus campos ni acciones.
export class SessionPage extends LoginPage {
    readonly logoutButton: Locator;

    constructor(page: Page) {
        super(page);
        this.logoutButton = page.getByRole("button", { name: "Cerrar Sesión", exact: false });
    }

    async signOut() { await this.logoutButton.click(); }
}
