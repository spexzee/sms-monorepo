/**
 * Late Fee Calculator Utility
 * Calculates late fee penalties based on due dates, payment dates, and school-defined rules.
 */

const getMidnightDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Calculates late fee for an overdue installment / item
 * 
 * @param {Date|string} dueDate - The original due date of the item
 * @param {Date|string} paymentDate - The date payment is being recorded (defaults to now)
 * @param {Object} lateFeeRule - Embedded late fee rule object from FeeStructure
 * @param {number} outstandingAmount - Outstanding base fee balance
 * @returns {number} - Calculated late fee amount (capped by maxLateFeeAmount)
 */
const calculateLateFee = (dueDate, paymentDate, lateFeeRule, outstandingAmount) => {
    if (!lateFeeRule || outstandingAmount <= 0) return 0;

    const due = getMidnightDate(dueDate);
    const pay = getMidnightDate(paymentDate || new Date());

    // If payment date is before or equal to due date, no late fee
    if (pay <= due) return 0;

    // Calculate calendar days difference
    const diffTime = pay - due;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const { gracePeriodDays = 0, lateFeeType, lateFeeValue, lateFeeFrequency, maxLateFeeAmount } = lateFeeRule;

    // Check if within grace period
    if (diffDays <= gracePeriodDays) {
        return 0;
    }

    // Days past grace period
    const penaltyDays = diffDays - gracePeriodDays;

    // Base penalty calculation (flat vs percentage of outstanding)
    const basePenalty = lateFeeType === 'percentage' 
        ? (outstandingAmount * (lateFeeValue / 100)) 
        : lateFeeValue;

    let totalLateFee = 0;

    if (lateFeeFrequency === 'once') {
        totalLateFee = basePenalty;
    } else if (lateFeeFrequency === 'daily') {
        totalLateFee = basePenalty * penaltyDays;
    } else if (lateFeeFrequency === 'weekly') {
        const penaltyWeeks = Math.ceil(penaltyDays / 7);
        totalLateFee = basePenalty * penaltyWeeks;
    } else if (lateFeeFrequency === 'monthly') {
        const penaltyMonths = Math.ceil(penaltyDays / 30);
        totalLateFee = basePenalty * penaltyMonths;
    }

    // Apply cap if defined
    if (maxLateFeeAmount !== undefined && maxLateFeeAmount !== null && maxLateFeeAmount > 0) {
        totalLateFee = Math.min(totalLateFee, maxLateFeeAmount);
    }

    // Round to 2 decimal places
    return Math.round((totalLateFee + Number.EPSILON) * 100) / 100;
};

module.exports = {
    calculateLateFee
};
