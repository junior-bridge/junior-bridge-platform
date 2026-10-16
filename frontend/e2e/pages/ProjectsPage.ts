import { type Locator, type Page } from "@playwright/test";

export class ProjectsPage {
    readonly search: Locator;
    readonly ratingDialog: Locator;
    readonly comment: Locator;
    readonly saveRating: Locator;
    readonly delivered: Locator;
    readonly completed: Locator;
    readonly rated: Locator;

    constructor(readonly page: Page) {
        this.search = page.getByPlaceholder("Buscar proyecto...");
        this.ratingDialog = page.getByRole("dialog", { name: "Calificar proyecto" });
        this.comment = this.ratingDialog.getByLabel("Comentario", { exact: true });
        this.saveRating = this.ratingDialog.getByRole("button", { name: "Guardar calificación" });
        this.delivered = page.getByText("Entrega finalizada correctamente.", { exact: true });
        this.completed = page.getByText("Proyecto completado correctamente.", { exact: true });
        this.rated = page.getByText("Calificación guardada correctamente.", { exact: true });
    }

    async navigate() { await this.page.goto("/dashboard/projects"); }
    card(id: number) { return this.page.getByTestId(`project-${id}`); }
    state(id: number, state: string) { return this.card(id).getByText(state, { exact: true }); }
    ratingComment(id: number, comment: string) { return this.card(id).getByText(comment, { exact: true }); }
    ratingButton(id: number) { return this.card(id).getByRole("button", { name: "Calificar proyecto" }); }
    async find(title: string) { await this.search.fill(title); }
    async finishDelivery(id: number) { await this.card(id).getByRole("button", { name: "Finalizar entrega" }).click(); }
    async complete(id: number) { await this.card(id).getByRole("button", { name: "Dar por completado" }).click(); }
    async openRating(id: number) { await this.ratingButton(id).click(); }
    star(stars: number) { return this.ratingDialog.getByRole("button", { name: `${stars} estrellas`, exact: true }); }
    async fillRating(stars: number, comment: string) {
        await this.star(stars).click();
        await this.comment.fill(comment);
    }
}
