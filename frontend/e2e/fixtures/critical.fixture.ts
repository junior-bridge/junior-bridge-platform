import { test as base, expect, type APIResponse, type Response } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { SessionPage } from "../pages/SessionPage";
import { ReportsPage } from "../pages/ReportsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { orm, runtime, verifyStack, type Runtime } from "../support/runtime";

export type SeedReport = {
    _id: string; id_postulation: number; title: string; description: string;
    severity: string; state: string; created_at: string; steps_to_reproduce: string[];
};
export type Seed = {
    run: string;
    users: Record<"client" | "tester" | "admin" | "outsider" | "empty" | "otherClient", { id: number; email: string }>;
    project: { id: number; title: string }; postulationId: number;
    foreignProjectId: number; foreignPostulationId: number; previousProjectId: number;
    reports: SeedReport[]; foreignReport: SeedReport;
};
export type Snapshot = {
    projects: { id: number; state: string; finalized_at: string | null }[];
    reports: SeedReport[];
    ratings: { id_rating: number; id_postulation: number; stars: number; comment: string }[];
    testerReputation: string; expectedReputation: number;
};
type Diagnostics = { expected: (path: string, status: number) => void };
type Session = { loginAs: (role: keyof Seed["users"]) => Promise<void>; logout: () => Promise<void> };
type Fixtures = {
    local: Runtime; seed: Seed; reports: ReportsPage; projects: ProjectsPage;
    session: Session; diagnostics: Diagnostics;
    snapshot: () => Promise<Snapshot>;
    api: {
        get: (path: string) => Promise<APIResponse>;
        post: (path: string, data?: object) => Promise<APIResponse>;
    };
};

export const test = base.extend<Fixtures>({
    // Las trazas automáticas capturan passwords de fill/login. Se trazan solo los tramos autenticados.
    trace: "off",
    local: async ({ baseURL }, provide) => {
        const value = runtime();
        await verifyStack(value, baseURL);
        await provide(value);
    },
    seed: async ({ local }, provide, info) => {
        const run = `E2E_JUNIORBRIDGE_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
        const value = await orm<Seed>(local, "seed", { run, password: local.password });
        await info.attach("fixtures-sin-credenciales", { body: JSON.stringify(value, null, 2), contentType: "application/json" });
        try { await provide(value); }
        finally {
            const result = await orm<{ users_remaining: number; projects_remaining: number; mongo_remaining: number }>(local, "cleanup", { run });
            await info.attach("teardown", { body: JSON.stringify(result), contentType: "application/json" });
            expect(result.users_remaining).toBe(0);
            expect(result.projects_remaining).toBe(0);
            expect(result.mongo_remaining).toBe(0);
        }
    },
    reports: async ({ page }, provide) => { await provide(new ReportsPage(page)); },
    projects: async ({ page }, provide) => { await provide(new ProjectsPage(page)); },
    diagnostics: [async ({ page, context, local }, provide, info) => {
        const issues: string[] = [];
        const knownIssues: string[] = [];
        const expected = new Set<string>();
        const allowedOrigins = new Set([local.baseURL, local.apiURL]);
        await context.route("**/*", async route => {
            const url = new URL(route.request().url());
            if (url.searchParams.has("password")) {
                issues.push("Se bloqueó un envío nativo del login antes de hidratar React");
                await route.abort("blockedbyclient");
            } else if (["http:", "https:"].includes(url.protocol) && !allowedOrigins.has(url.origin)) {
                issues.push(`Solicitud externa bloqueada: ${url.origin}${url.pathname}`);
                await route.abort("blockedbyclient");
            } else await route.continue();
        });
        page.on("pageerror", error => issues.push(`pageerror: ${error.message}`));
        page.on("console", message => {
            if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) issues.push(`console: ${message.text()}`);
        });
        page.on("response", response => {
            const path = new URL(response.url()).pathname;
            const code = response.status();
            const known = (path === "/api/auth/profile/" && [401, 403].includes(code)) ||
                (/\/api\/projects\/\d+\/audit\/$/.test(path) && code === 404) ||
                (/\/api\/postulations\/\d+\/rating\/$/.test(path) && code === 404) ||
                (path === "/dashboard/settings" && code === 404 && response.request().headers()["next-router-prefetch"] === "1");
            if (known) knownIssues.push(`HTTP ${code}: ${path}`);
            if (code >= 400 && !known && !expected.has(`${path}:${code}`)) issues.push(`HTTP ${code}: ${path}`);
        });
        page.on("requestfailed", request => {
            // Navegaciones canceladas por cambio de pantalla son normales en Next.
            if (!request.failure()?.errorText.includes("ERR_ABORTED")) issues.push(`Red: ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
        });
        await provide({ expected: (path, status) => { expected.add(`${path}:${status}`); } });
        await info.attach("diagnosticos-navegador", { body: JSON.stringify(issues, null, 2), contentType: "application/json" });
        await info.attach("respuestas-previstas-o-previas", { body: JSON.stringify(knownIssues, null, 2), contentType: "application/json" });
        expect(issues, "Errores inesperados del navegador/red").toEqual([]);
    }, { auto: true }],
    session: async ({ page, context, local, seed }, provide, info) => {
        const auth = new SessionPage(page);
        let tracing = false;
        const tracePaths: string[] = [];
        const stopTrace = async () => {
            if (!tracing) return;
            const path = info.outputPath(`session-${tracePaths.length + 1}.zip`);
            await context.tracing.stop({ path });
            tracePaths.push(path);
            tracing = false;
        };
        await provide({
            loginAs: async role => {
                await stopTrace();
                // El GET de perfil ocurre en useEffect: confirma hidratación antes de ingresar credenciales.
                const ready = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/profile/" && r.request().method() === "GET", { timeout: 30_000 });
                await auth.navigate();
                await ready;
                const response = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/login/" && r.request().method() === "POST");
                await auth.login(seed.users[role].email, local.password);
                expect((await response).status()).toBe(200);
                await expect(page).toHaveURL(/\/dashboard$/);
                const cookies = await context.cookies(local.apiURL);
                expect(cookies.find(cookie => cookie.name === "access_token")).toMatchObject({ httpOnly: true, sameSite: "Lax" });
                const profile = await page.request.get(`${local.apiURL}/api/auth/profile/`);
                expect(profile.status()).toBe(200);
                expect(await profile.json()).toMatchObject({ id: seed.users[role].id });
                await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
                tracing = true;
            },
            logout: async () => {
                await stopTrace();
                const response = page.waitForResponse(r => new URL(r.url()).pathname === "/api/auth/logout/" && r.request().method() === "POST");
                await auth.signOut();
                expect([200, 204]).toContain((await response).status());
                await expect(page).toHaveURL(/\/login$/);
                expect((await context.cookies(local.apiURL)).some(cookie => cookie.name === "access_token")).toBe(false);
            },
        });
        await stopTrace();
        for (const path of tracePaths) {
            if (info.status !== info.expectedStatus) await info.attach("trace-autenticado", { path, contentType: "application/zip" });
            else await rm(path, { force: true });
        }
    },
    snapshot: async ({ local, seed }, provide) => {
        await provide(() => orm<Snapshot>(local, "snapshot", { run: seed.run }));
    },
    api: async ({ page, local }, provide) => {
        await provide({
            get: path => page.request.get(`${local.apiURL}${path}`),
            post: async (path, data) => {
                const csrf = await page.request.get(`${local.apiURL}/api/auth/csrf/`);
                expect(csrf.ok()).toBe(true);
                const token = (await csrf.json()).csrfToken;
                return page.request.post(`${local.apiURL}${path}`, { data, headers: { "X-CSRFToken": token, Origin: local.baseURL } });
            },
        });
    },
});

export { expect };

export function responseFor(path: string, method: string) {
    return (response: Response) => new URL(response.url()).pathname === path && response.request().method() === method;
}

export async function evidence(page: import("@playwright/test").Page, info: import("@playwright/test").TestInfo, name: string) {
    const path = info.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await info.attach(name, { path, contentType: "image/png" });
}
