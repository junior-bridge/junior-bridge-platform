
import { type Locator, type Page } from "@playwright/test";

export class DashboardPage {
    private readonly greeting: Locator;

    constructor(private readonly page: Page) {
        this.greeting = this.page.getByText(/^Hola,/);
    }

    async getGreetingText(): Promise<string | null> {
        await this.greeting.waitFor({ state: "visible" });
        return this.greeting.textContent();
    }
}
