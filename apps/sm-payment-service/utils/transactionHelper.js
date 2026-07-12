const { recalculateAccount } = require("./accountHelper");

/**
 * Transaction Helper
 * Atomically creates a FeeTransaction log and applies the financial update 
 * to the StudentFeeAssignment ledger. Ensures data consistency and integrity.
 */

/**
 * Creates a transaction log and applies updates to the StudentFeeAssignment ledger atomically.
 *
 * @param {Object} options
 * @param {Object} options.account - The Mongoose StudentFeeAssignment document
 * @param {Object} options.TransactionModel - The FeeTransaction model
 * @param {string} options.type - Transaction type (payment, discount_applied, adjustment_debit, etc.)
 * @param {number} options.amount - Total amount of transaction
 * @param {string} options.description - Detailed description
 * @param {string} [options.reason] - Reason for waivers/refunds/adjustments
 * @param {Array} options.affectedItems - Array of objects tracking categoryName, feeCategoryId, amount
 * @param {string} options.performedBy - User ID of the admin
 * @param {string} options.performedByName - Name of the admin
 * @param {string} options.performedByRole - Role of the admin
 * @param {Object} [options.paymentFields] - Additional fields for payment mode, ref number, etc.
 * @param {Object} [options.refundFields] - Additional fields for refunds
 * @param {Object} [options.session] - Mongoose transaction session (optional)
 * @returns {Promise<Object>} - The created transaction document
 */
const createTransaction = async ({
    account,
    TransactionModel,
    type,
    amount,
    description,
    reason = '',
    affectedItems = [],
    performedBy,
    performedByName,
    performedByRole,
    paymentFields = {},
    refundFields = {},
    session = null
}) => {
    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

    // 1. Capture balanceBefore
    const balanceBefore = account.totalBalance;

    // 2. Apply updates to the account ledger breakdown & schedules based on transaction type
    affectedItems.forEach((item) => {
        const lineItem = account.feeBreakdown.find(f => f.feeCategoryId === item.feeCategoryId);
        if (!lineItem) return;

        const paid = item.amount || 0;
        const lateFee = item.lateFeeAmount || 0;

        if (type === 'payment') {
            lineItem.paidAmount += paid;
            lineItem.lateFeeCharged += lateFee;
            
            // If installment is enabled, update installment schedule
            if (item.installmentNumber && account.installmentSchedule) {
                const inst = account.installmentSchedule.find(i => i.installmentNumber === item.installmentNumber);
                if (inst) {
                    inst.paidAmount += (paid + lateFee);
                    inst.lateFeeApplied += lateFee;
                }
            }
        } else if (type === 'refund_issued') {
            lineItem.refundedAmount += paid;
            
            if (item.installmentNumber && account.installmentSchedule) {
                const inst = account.installmentSchedule.find(i => i.installmentNumber === item.installmentNumber);
                if (inst) {
                    inst.paidAmount -= paid;
                }
            }
        } else if (type === 'discount_applied') {
            lineItem.discountAmount += paid;
        } else if (type === 'discount_removed') {
            lineItem.discountAmount -= paid;
        } else if (type === 'waiver') {
            lineItem.waivedAmount += paid;
        } else if (type === 'adjustment_debit') {
            lineItem.adjustments += paid;
        } else if (type === 'adjustment_credit') {
            lineItem.adjustments -= paid;
        }
    });

    // 3. Recalculate ledger totals & balances
    recalculateAccount(account);

    // 4. Capture balanceAfter
    const balanceAfter = account.totalBalance;

    // 5. Build transaction payload mapping properties to satisfy FeePaymentSchema (FeeTransaction) requirements
    let studentName = account.studentName;
    if (!studentName && account.studentId) {
        try {
            const schoolDb = account.constructor.db;
            const StudentModel = schoolDb.model('Student');
            const student = await StudentModel.findOne({ studentId: account.studentId }).lean();
            if (student) {
                studentName = `${student.firstName} ${student.lastName}`;
            }
        } catch (err) {
            console.error('Error looking up student name for transaction:', err);
        }
    }
    if (!studentName) studentName = 'Student';

    // Map affectedItems to paymentItems
    const paymentItems = affectedItems.map(item => {
        const lineItem = account.feeBreakdown.find(f => f.feeCategoryId === item.feeCategoryId);
        return {
            feeCategoryId: item.feeCategoryId,
            categoryName: item.categoryName || lineItem?.categoryName || 'Fee Category',
            installmentNumber: item.installmentNumber || null,
            outstandingAmount: item.outstandingAmount !== undefined ? item.outstandingAmount : (lineItem?.balanceAmount || 0),
            lateFeeAmount: item.lateFeeAmount || 0,
            paidAmount: item.amount || amount
        };
    });

    const totalFeeAmount = paymentItems.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalLateFee = paymentItems.reduce((sum, item) => sum + (item.lateFeeAmount || 0), 0);

    const transactionPayload = {
        paymentId: transactionId,
        transactionId,
        schoolId: account.schoolId,
        studentId: account.studentId,
        studentName,
        assignmentId: account.assignmentId || account.accountId || `ASG-${Date.now()}`,
        academicYear: account.academicYear,
        paymentType: type === 'refund_issued' ? 'refund' : 'payment',
        type,
        paymentMode: paymentFields?.paymentMode || 'cash',
        paymentDate: paymentFields?.paymentDate || new Date(),
        referenceNumber: paymentFields?.referenceNumber || '',
        bankName: paymentFields?.bankName || '',
        remarks: reason || description || '',
        paymentItems,
        totalFeeAmount,
        totalLateFee,
        totalAmountReceived: totalFeeAmount + totalLateFee,
        amount: totalFeeAmount + totalLateFee,
        description,
        reason,
        affectedItems,
        balanceBefore,
        balanceAfter,
        createdBy: performedBy || 'system',
        createdByName: performedByName || 'Admin',
        performedBy,
        performedByName,
        performedByRole,
        ...paymentFields,
        ...refundFields
    };

    // 6. Save transaction document
    const transaction = new TransactionModel(transactionPayload);
    await transaction.save({ session });

    // 7. Save updated account ledger
    await account.save({ session });

    return transaction;
};

module.exports = {
    createTransaction
};
