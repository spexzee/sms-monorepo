// apps/sm-payment-service/validators/studentFeeAccount.validator.js

class StudentFeeAccountValidator {
    validateAssign(body) {
        const errors = [];
        if (!body.classId && (!body.studentIds || !Array.isArray(body.studentIds) || body.studentIds.length === 0)) {
            errors.push('Either classId or studentIds array is required for fee assignment.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new StudentFeeAccountValidator();
