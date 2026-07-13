/**
 * ID Generation Utility
 * Generates short, unique identifiers with specific prefixes
 * following the system leaveId generation pattern.
 */

const generateUniqueId = (prefix) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}${timestamp}${random}`.toUpperCase();
};

module.exports = {
    generateCategoryId: () => generateUniqueId('FC'),
    generateStructureId: () => generateUniqueId('FS'),
    generateAssignmentId: () => generateUniqueId('SFA'),
    generatePaymentId: () => generateUniqueId('PAY'),
    generateReceiptId: () => generateUniqueId('RCP'),
    generateDiscountId: () => generateUniqueId('DISC'),
    generateAdjustmentId: () => generateUniqueId('ADJ'),
};
