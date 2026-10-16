import { type Locator, type Page } from "@playwright/test";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export class ReportsPage {
    readonly dialog: Locator;
    readonly newReport: Locator;
    readonly postulation: Locator;
    readonly title: Locator;
    readonly description: Locator;
    readonly severity: Locator;
    readonly steps: Locator;
    readonly submit: Locator;
    readonly search: Locator;
    readonly date: Locator;
    readonly exportButton: Locator;
    readonly rows: Locator;
    readonly success: Locator;
    readonly exportError: Locator;
    readonly empty: Locator;

    constructor(readonly page: Page) {
        this.dialog = page.getByRole("dialog", { name: "Crear Nuevo Reporte de Bug" });
        this.newReport = page.getByRole("button", { name: "Nuevo Reporte" });
        this.postulation = this.dialog.getByLabel("Postulación / Proyecto", { exact: false });
        this.title = this.dialog.getByLabel("Título del Bug", { exact: false });
        this.description = this.dialog.getByLabel("Descripción Detallada", { exact: false });
        this.severity = this.dialog.getByLabel("Severidad", { exact: true });
        this.steps = this.dialog.getByLabel("Pasos para Reproducir", { exact: false });
        this.submit = this.dialog.getByRole("button", { name: "Crear Reporte", exact: true });
        this.search = page.getByPlaceholder("Buscar reporte...");
        this.date = page.getByLabel("Filtrar por fecha de creación");
        this.exportButton = page.getByRole("button", { name: "Exportar", exact: true });
        this.rows = page.getByRole("row").filter({ has: page.getByRole("cell") });
        this.success = page.getByRole("heading", { name: "Reporte creado", exact: true });
        this.exportError = page.getByRole("heading", { name: "No se pudo exportar" });
        this.empty = page.getByText("No hay reportes para mostrar.", { exact: true });
    }

    async navigate() { await this.page.goto("/dashboard/reports"); }
    async openForm() { await this.newReport.click(); }
    row(title: string) { return this.rows.filter({ has: this.page.getByRole("cell", { name: title, exact: true }) }); }
    async fillForm(data: { postulationId: number; title: string; description: string; severity: string; steps: string[] }) {
        await this.postulation.selectOption(String(data.postulationId));
        await this.title.fill(data.title);
        await this.description.fill(data.description);
        await this.severity.selectOption(data.severity);
        await this.steps.fill(data.steps.join("\n"));
    }
    async acceptMessage() { await this.page.getByRole("button", { name: "Aceptar", exact: true }).click(); }
    async filter(query = "", date = "") {
        await this.search.fill(query);
        await this.date.fill(date);
    }
    async chooseExport(format: ExportFormat) {
        await this.exportButton.click();
        await this.page.getByRole("menuitem", { name: { csv: "Descargar CSV", xlsx: "Descargar Excel", pdf: "Descargar PDF" }[format] }).click();
    }
}
