import { Page, TestInfo, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export async function checkA11y(page: Page, testInfo: TestInfo, label: string) {
    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

    await testInfo.attach(`axe-${label}`, {
        body: JSON.stringify(results, null, 2),
        contentType: "application/json",
    });

    const resumen = results.violations.map(
        (v) =>
            `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elemento/s)`,
    );

    expect
        .soft(
            results.violations.length,
            `Violaciones en "${label}":\n${resumen.join("\n")}`,
        )
        .toBe(0);
}
