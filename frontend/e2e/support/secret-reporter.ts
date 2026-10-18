import type { Reporter, TestCase, TestResult, TestStep } from "@playwright/test/reporter";
import { runtime } from "./runtime";

// Debe ir ANTES de list/json/html: Playwright incluye el valor de fill en el título del paso.
export default class SecretReporter implements Reporter {
    private readonly secret = runtime().password;

    private redact(value: string) { return value.replaceAll(this.secret, "[CREDENCIAL_LOCAL]"); }
    private redactStep(step: TestStep) {
        step.title = this.redact(step.title);
        for (const child of step.steps) this.redactStep(child);
    }
    onStepBegin(_test: TestCase, _result: TestResult, step: TestStep) { this.redactStep(step); }
    onStepEnd(_test: TestCase, _result: TestResult, step: TestStep) { this.redactStep(step); }
    onTestEnd(_test: TestCase, result: TestResult) {
        for (const step of result.steps) this.redactStep(step);
        for (const error of result.errors) {
            if (error.message) error.message = this.redact(error.message);
            if (error.stack) error.stack = this.redact(error.stack);
            if (error.snippet) error.snippet = this.redact(error.snippet);
        }
    }
}
