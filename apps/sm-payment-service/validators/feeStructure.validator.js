// apps/sm-payment-service/validators/feeStructure.validator.js

class FeeStructureValidator {
    validateCreate(body) {
        const errors = [];
        if (!body.name || typeof body.name !== 'string') {
            errors.push('Structure name is required.');
        }
        if (!body.academicYear || !/^\d{4}-\d{4}$/.test(body.academicYear)) {
            errors.push('Academic year is required in YYYY-YYYY format.');
        }
        if (!body.applicableClasses || !Array.isArray(body.applicableClasses) || body.applicableClasses.length === 0) {
            errors.push('At least one applicable class is required.');
        }
        if (!body.feeItems || !Array.isArray(body.feeItems) || body.feeItems.length === 0) {
            errors.push('At least one fee item is required.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateUpdate(body) {
        const errors = [];
        // Optional updates validators checks
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new FeeStructureValidator();
