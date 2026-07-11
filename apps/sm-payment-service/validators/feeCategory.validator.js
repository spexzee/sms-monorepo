// apps/sm-payment-service/validators/feeCategory.validator.js

class FeeCategoryValidator {
    validateCreate(body) {
        const errors = [];
        if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
            errors.push('Name is required and must be at least 2 characters.');
        }
        if (!body.categoryType || typeof body.categoryType !== 'string') {
            errors.push('CategoryType is required.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateUpdate(body) {
        const errors = [];
        if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 2)) {
            errors.push('Name must be at least 2 characters.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new FeeCategoryValidator();
