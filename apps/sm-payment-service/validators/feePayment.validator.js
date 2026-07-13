// apps/sm-payment-service/validators/feePayment.validator.js

class FeePaymentValidator {
    validateRecord(body) {
        const errors = [];
        if (!body.studentId) errors.push('studentId is required.');
        if (!body.paymentMode) errors.push('paymentMode is required.');
        const rawItems = body.paymentItems || body.items;
        if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
            errors.push('paymentItems array must contain at least one item.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateRefund(body) {
        const errors = [];
        if (!body.refundAmount || Number(body.refundAmount) <= 0) errors.push('Valid refundAmount is required.');
        if (!body.refundMode) errors.push('refundMode is required.');
        if (!body.reason || body.reason.trim().length < 10) {
            errors.push('Reason for refund is required and must be at least 10 characters.');
        }
        if (!body.affectedItems || !Array.isArray(body.affectedItems) || body.affectedItems.length === 0) {
            errors.push('affectedItems array must specify categories to refund.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new FeePaymentValidator();
