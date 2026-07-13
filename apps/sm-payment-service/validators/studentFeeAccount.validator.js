// apps/sm-payment-service/validators/studentFeeAccount.validator.js

class StudentFeeAccountValidator {
    validateAssign(body) {
        const errors = [];
        // classId and studentIds are both optional — the service falls back to
        // structure.applicableClasses when neither is provided.
        if (body.studentIds !== undefined && (!Array.isArray(body.studentIds) || body.studentIds.length === 0)) {
            errors.push('studentIds must be a non-empty array when provided.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new StudentFeeAccountValidator();
