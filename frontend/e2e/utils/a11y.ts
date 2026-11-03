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

    const resumen = results.violations.flatMap((violation) =>
        violation.nodes.map((node, index) =>
            [
                `[${violation.impact}] ${violation.id}: ${violation.help}`,
                `  Elemento ${index + 1}: ${node.target.join(", ")}`,
                `  HTML: ${node.html}`,
                `  Detalle: ${node.failureSummary ?? "Axe no proporcionó detalles adicionales."}`,
            ].join("\n"),
        ),
    );

    expect
        .soft(
            results.violations.length,
            `Violaciones en "${label}":\n${resumen.join("\n")}`,
        )
        .toBe(0);
}
