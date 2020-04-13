import { toYaml } from "../src/converter";
import { Parser } from "../src/parser";
import { sanitize } from "../src/sanitizer";
import { IMonitorValidator } from "../src/monitorValidator";
import { ValidatorResult } from "jsonschema";

jest.mock("../src/converter");
jest.mock("../src/sanitizer");
(sanitize as jest.Mock).mockImplementation((input) => input);

let parser: Parser;
let validatorMock: MonitorValidatorMock;
let validationErrors: string[];
let validationCallback = (errors: string[]) => validationErrors = errors;

describe('parse', () => {
    
    beforeEach(() => {
        validatorMock = new MonitorValidatorMock();
        validatorMock.isValid = true;
        validationErrors = [];
        parser = new Parser(validatorMock);
        parser.setOnValidationErrors(validationCallback);
        jest.clearAllMocks();
    });
    
    it('should sanitize input', () => {
        parser.parse("{}");
        expect(sanitize).toHaveBeenCalled();
    });

    it('should validate input', () => {
        parser.parse("{}");
        expect(validatorMock.hasValidated).toBe(true);
    });

    describe('invalid input', () => {
        beforeEach(() => {
            validatorMock.isValid = false;
        })

        it('should return null', () => {
            const result = parser.parse("{}");
            expect(result).toBe(null);
        });

        it('should call the validation error callback', () => {
            parser.parse("{}");
            expect(validationErrors).not.toHaveLength(0);
        });

        it('should not convert input', () => {
            parser.parse("{}");
            expect(toYaml).not.toHaveBeenCalled();
        });
    });

    describe('valid input', () => {
        it('should not return null', () => {
            const result = parser.parse("{}");
            expect(result).not.toBe(null);
        });

        it('should not call the validation error callback', () => {
            parser.parse("{}");
            expect(validationErrors).toHaveLength(0);
        });

        it('should convert input', () => {
            parser.parse("{}");
            expect(toYaml).toHaveBeenCalled();
        });
    });
});

describe('setIndentSize', () => {
    it('should set the indent size', () => {
        validatorMock = new MonitorValidatorMock();
        validatorMock.isValid = true;
        parser = new Parser(validatorMock);
        
        parser.setIndentSize(6);

        parser.parse("{}");
        expect(toYaml).toHaveBeenCalledWith({}, 6);
    });
});

describe('setOnValidationErrors', () => {
    it ('should set the onValidationErrors callback', () => {
        validatorMock = new MonitorValidatorMock();
        validatorMock.isValid = false;
        parser = new Parser(validatorMock);

        parser.parse("{}");
        expect(validationErrors).toHaveLength(0);

        parser.setOnValidationErrors(validationCallback);
        parser.parse("{}");
        expect(validationErrors).not.toHaveLength(0);
    });
});

class MonitorValidatorMock implements IMonitorValidator {
    private validated = false;

    public get hasValidated(): boolean {
        return this.validated;
    }

    public constructor() { 
        this.validated = false;
    }

    public isValid: boolean = true;

    public validate(_json: {}): ValidatorResult {
        this.validated = true;
        if (this.isValid) {
            return <ValidatorResult> { valid: true };
        }
        return <ValidatorResult> { 
            valid: false, 
            errors: [{
                message: "ValidationError"
            }]
        };
    }
}