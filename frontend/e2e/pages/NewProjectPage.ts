import { type Locator, type Page } from "@playwright/test";

export class NewProjectPage {
    readonly page: Page;
    readonly titleInput: Locator;
    readonly descriptionInput: Locator;
    readonly repositoryInput: Locator;
    readonly demoUrlInput: Locator;
    readonly technologiesInput: Locator;
    readonly modalitySelect: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.titleInput = page.locator("#title");
        this.descriptionInput = page.locator("#description");
        this.repositoryInput = page.locator("#repository");
        this.demoUrlInput = page.locator("#demo_url");
        this.technologiesInput = page.locator("#technologies");
        this.modalitySelect = page.locator("#modality");
        this.submitButton = page.getByRole("button", {
            name: "Publicar proyecto",
        });
    }

    async navigate() {
        await this.page.goto("/dashboard/projects/new");
    }

    async fillValidForm() {
        await this.titleInput.fill("Proyecto de prueba E2E");
        await this.descriptionInput.fill("Proyecto creado para verificar el flujo de publicación.");
        await this.repositoryInput.fill("https://github.com/ejemplo/proyecto.com");
        await this.demoUrlInput.fill("https://demo.ejemplo.com");
        await this.technologiesInput.fill("Python, Django, React");
        await this.modalitySelect.selectOption("REMOTE");
    }
}
