import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

export type Runtime = {
    stack: string; baseURL: string; apiURL: string; composeFile: string;
    envFile: string; password: string; readerPython: string; evidenceDir: string;
};

export function runtime(): Runtime {
    const file = process.env.E2E_RUNTIME_FILE;
    if (!file || !isAbsolute(file)) throw new Error("Definí E2E_RUNTIME_FILE con el runtime.json externo preparado por run-e2e.ps1.");
    const value: Runtime = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
    if (!/^juniorbridge-e2e-[a-z0-9-]+$/.test(value.stack) || !value.password) throw new Error("Runtime E2E inválido");
    for (const address of [value.baseURL, value.apiURL]) {
        const url = new URL(address);
        if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port) throw new Error("Solo se permiten puertos HTTP locales explícitos");
    }
    return value;
}

export function command(executable: string, args: string[], input = ""): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = execFile(executable, args, { timeout: 45_000, maxBuffer: 5 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
            // Nunca incluir input (puede contener el password), env ni argumentos sensibles en errores.
            if (error) reject(new Error(`Falló ${executable}: ${stderr || error.message}`));
            else resolve(stdout);
        });
        child.stdin?.end(input);
    });
}

export function composeArgs(value: Runtime) {
    return ["compose", "--project-name", value.stack, "--env-file", value.envFile, "-f", value.composeFile];
}

export async function orm<T>(value: Runtime, action: string, payload: object): Promise<T> {
    const stdout = await command("docker", [...composeArgs(value), "exec", "-T", "backend", "python", "/e2e/fixtures.py", action], JSON.stringify(payload));
    const line = stdout.split(/\r?\n/).find(line => line.startsWith("E2E_JSON:"));
    if (!line) throw new Error("El helper ORM no devolvió un resultado verificable");
    return JSON.parse(line.slice("E2E_JSON:".length));
}

export async function verifyStack(value: Runtime, baseURL: string | undefined) {
    if (baseURL !== value.baseURL) throw new Error("El baseURL de Playwright no coincide con el Compose E2E");
    const raw = await command("docker", [...composeArgs(value), "ps", "--format", "json"]);
    const containers = raw.trim().startsWith("[") ? JSON.parse(raw) : raw.trim().split(/\r?\n/).map(line => JSON.parse(line));
    for (const [service, address, internalPort] of [["frontend", value.baseURL, 3000], ["backend", value.apiURL, 8000]] as const) {
        const container = containers.find((item: { Service: string }) => item.Service === service);
        const port = Number(new URL(address).port);
        if (!container || container.State !== "running" || container.Health !== "healthy" || !container.Publishers?.some(
            (item: { URL: string; PublishedPort: number; TargetPort: number }) => item.URL === "127.0.0.1" && item.PublishedPort === port && item.TargetPort === internalPort,
        )) throw new Error(`No se verificó identidad/health/puerto de ${service} en ${value.stack}`);
    }
    const identity = await orm<{ stack: string }>(value, "guard", {});
    if (identity.stack !== value.stack) throw new Error("El backend no pertenece al stack E2E esperado");
}
