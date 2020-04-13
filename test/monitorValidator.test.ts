import { MonitorValidator } from "../src/monitorValidator";

const validator = new MonitorValidator();

describe('validate', () => {
    describe('required property missing', () => {
        it('should invalidate when name is missing', () => {
            testMissingRequiredProperty('name');
        });

        it('should invalidate when type is missing', () => {
            testMissingRequiredProperty('type');
        });

        it('should invalidate when query is missing', () => {
            testMissingRequiredProperty('query');
        });

        it('should invalidate when message is missing', () => {
            testMissingRequiredProperty('message');
        });
    });

    it('should validate when an id is present', () => {
        let input = getDatadogExport();
        input.id = 42;

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should validate when an id is not present', () => {
        let input = getDatadogExport();
        delete input.id;

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should invalidate when type is incorrect', () => {
        let input = getDatadogExport();
        input["type"] = "something";

        const result = validator.validate(input);

        expect(result.valid).toBe(false);
        expect(result.errors[0].property).toBe("instance.type");
    });

    it('should invalidate when additional properties are present', () => {
        let input = getDatadogExport();
        input["additional"] = "Shoud not be here";

        const result = validator.validate(input);

        expect(result.valid).toBe(false);
        expect(result.errors[0].argument).toBe("additional");
    });

    it('should invalidate when additional properties are present in options', () => {
        let input = getDatadogExport();
        input.options["additional"] = "Shoud not be here";

        const result = validator.validate(input);

        expect(result.valid).toBe(false);
        expect(result.errors[0].argument).toBe("additional");
    });

    it('should validate when no options are specified', () => {
        let input = getDatadogExport();
        delete input.options;

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should validate when no_data_timeframe equals null', () => {
        let input = getDatadogExport();
        input.options.no_data_timeframe = null;

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should validate when renotify_interval is an integer string', () => {
        let input = getDatadogExport();
        input.options.renotify_interval = "4";

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should not validate when renotify_interval is not an integer string', () => {
        let input = getDatadogExport();
        input.options.renotify_interval = "4.5";

        const result = validator.validate(input);

        expect(result.valid).toBe(false);
        expect(result.errors[0].property).toBe("instance.options.renotify_interval");
    });

    it('should validate when thresholds are metric', () => {
        let input = getDatadogExport();
        input.options.thresholds = {
            critical: 95.0,
            critical_recovery: 90.1,
            warning: 85.0,
            warning_recovery: 80.1
        };

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should validate when thresholds are service', () => {
        let input = getDatadogExport();
        input.options.thresholds = {
            ok: 1,
            critical: 10,
            warning: 5,
            unknown: 0
        };

        const result = validator.validate(input);

        expect(result.valid).toBe(true);
    });

    it('should not validate when thresholds are not one of metric,service', () => {
        let input = getDatadogExport();
        input.options.thresholds = {
            ok: 1,
            critical: 10,
            critical_recovery: 7,
            warning: 5,
            warning_recovery: 3,
            unknown: 0
        };

        const result = validator.validate(input);

        expect(result.valid).toBe(false);
        expect(result.errors[0].property).toBe("instance.options.thresholds");
    });

    it('should validate the Datadog UI JSON export', () => {
        const result = validator.validate(getDatadogExport());
        expect(result.valid).toBe(true);
    });
});

function testMissingRequiredProperty(propertyName: string) {
    let input = getDatadogExport();
    delete input[propertyName];

    const result = validator.validate(input);

    expect(result.valid).toBe(false);
    expect(result.errors[0].argument).toBe(propertyName);
};

function getDatadogExport(): any {
    return JSON.parse(`{
    "id": 1,
    "name": "Some monitor name",
    "type": "query alert",
    "query": "avg(last_5m):max:system.disk.in_use{*} by {device,host} > 0.95",
    "message": "Something bad happened",
    "tags": [],
    "options": {
        "notify_audit": false,
        "locked": false,
        "timeout_h": 0,
        "new_host_delay": 300,
        "require_full_window": true,
        "notify_no_data": false,
        "renotify_interval": "2",
        "escalation_message": "Go fix this",
        "no_data_timeframe": 1,
        "include_tags": true,
        "thresholds": {
            "critical": 0.90,
            "warning": 0.80,
            "warning_recovery": 0.75,
            "critical_recovery": 0.85
        }
    },
    "restricted_roles": null
}`);
};