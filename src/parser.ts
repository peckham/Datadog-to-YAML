import { DefaultIndentSize } from "./constants";
import { IMonitorValidator } from "./monitorValidator";
import { sanitize } from "./sanitizer";
import { toYaml } from "./converter";

export interface IParser {
    setIndentSize(indentSize: number): void;
    setOnValidationErrors(callback: (errors: string[]) => void): void;
    parse(json: string): string | null;
}

export class Parser implements IParser {
    private indentSize: number = DefaultIndentSize;
    private onValidationErrors: ((errors: string[]) => void) | undefined;

    public constructor(private readonly validator: IMonitorValidator) { }

    public setIndentSize(indentSize: number): void {
        this.indentSize = indentSize;
    }

    public setOnValidationErrors(callback: (errors: string[]) => void): void {
        this.onValidationErrors = callback;
    }

    public parse(json: string): string | null {
        const sanitized = sanitize(json);
        const monitor = JSON.parse(sanitized);
        const results = this.validator.validate(monitor);

        if (!results.valid) {
            if (this.onValidationErrors) {
                this.onValidationErrors(results.errors.map(err => err.message));
            }
            
            return null;
        }

        return toYaml(monitor, this.indentSize);
    }
}