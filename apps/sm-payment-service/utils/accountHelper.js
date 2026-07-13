/**
 * Student Fee Account Helper
 * Handles automatic recalculations of totals, breakdown statuses, and installment schedules
 * to ensure consistency across the student's running fee ledger.
 */

/**
 * Recalculates all balances, statuses, and totals on a StudentFeeAssignment document.
 * This should be called before saving any assignment ledger updates.
 *
 * @param {Object} account - Mongoose StudentFeeAssignment document
 */
const recalculateAccount = (account) => {
    if (!account) return;

    let totalOriginalFees = 0;
    let totalAdjustments = 0;
    let totalDiscount = 0;
    let totalWaived = 0;
    let totalPaid = 0;
    let totalRefunded = 0;
    let totalLateFee = 0;

    // 1. Recalculate each item in feeBreakdown
    if (account.feeBreakdown && account.feeBreakdown.length > 0) {
        account.feeBreakdown.forEach((item) => {
            // Apply logic checks
            const originalAmount = item.originalAmount || 0;
            const adjustments = item.adjustments || 0;
            const discountAmount = item.discountAmount || 0;
            const waivedAmount = item.waivedAmount || 0;
            const paidAmount = item.paidAmount || 0;
            const refundedAmount = item.refundedAmount || 0;
            const lateFeeCharged = item.lateFeeCharged || 0;

            // netAmount = originalAmount + adjustments - discountAmount - waivedAmount
            const netAmount = Math.max(0, originalAmount + adjustments - discountAmount - waivedAmount);
            item.netAmount = netAmount;

            // balanceAmount = netAmount + lateFeeCharged - paidAmount + refundedAmount
            const balanceAmount = Math.max(0, netAmount + lateFeeCharged - paidAmount + refundedAmount);
            item.balanceAmount = balanceAmount;

            // Determine item status
            if (waivedAmount > 0 && waivedAmount >= (originalAmount + adjustments - discountAmount)) {
                item.status = 'waived';
            } else if (refundedAmount > 0 && refundedAmount >= paidAmount) {
                item.status = 'refunded';
            } else if (balanceAmount <= 0) {
                item.status = 'paid';
            } else if (paidAmount > 0 && balanceAmount > 0) {
                item.status = 'partial';
            } else {
                item.status = 'unpaid';
            }

            // Sum totals
            totalOriginalFees += originalAmount;
            totalAdjustments += adjustments;
            totalDiscount += discountAmount;
            totalWaived += waivedAmount;
            totalPaid += paidAmount;
            totalRefunded += refundedAmount;
            totalLateFee += lateFeeCharged;
        });
    }

    // 2. Update parent totals
    account.totalOriginalFees = totalOriginalFees;
    account.totalAdjustments = totalAdjustments;
    account.totalDiscount = totalDiscount;
    account.totalWaived = totalWaived;
    account.totalPaid = totalPaid;
    account.totalRefunded = totalRefunded;
    account.totalLateFee = totalLateFee;

    // netFees = totalOriginalFees + totalAdjustments - totalDiscount - totalWaived
    const netFees = Math.max(0, totalOriginalFees + totalAdjustments - totalDiscount - totalWaived);
    account.netFees = netFees;

    // totalBalance = netFees + totalLateFee - totalPaid + totalRefunded
    const totalBalance = Math.max(0, netFees + totalLateFee - totalPaid + totalRefunded);
    account.totalBalance = totalBalance;

    // 3. Recalculate installments status if applicable
    let hasOverdueInstallment = false;
    const now = new Date();

    if (account.installmentSchedule && account.installmentSchedule.length > 0) {
        // First compute total expected net fees for installments
        // The installment totals should sum to netFees
        account.installmentSchedule.forEach((inst) => {
            const paid = inst.paidAmount || 0;
            const lateFee = inst.lateFeeApplied || 0;
            
            // Adjust balance amount = totalAmount + lateFee - paid
            const balance = Math.max(0, inst.totalAmount + lateFee - paid);
            inst.balanceAmount = balance;

            if (balance <= 0) {
                inst.status = 'paid';
            } else if (paid > 0 && balance > 0) {
                inst.status = 'partial';
            } else if (balance > 0 && now > new Date(inst.dueDate)) {
                inst.status = 'overdue';
                hasOverdueInstallment = true;
            } else {
                inst.status = 'pending';
            }
        });
    }

    // 4. Determine overall account status
    // Manual statuses are not overwritten automatically
    const manualStatuses = ['frozen', 'transferred_out', 'transferred_in', 'waived'];
    if (!manualStatuses.includes(account.accountStatus)) {
        if (totalBalance <= 0) {
            account.accountStatus = 'paid';
        } else if (hasOverdueInstallment) {
            account.accountStatus = 'overdue';
        } else if (totalPaid > 0 && totalBalance > 0) {
            account.accountStatus = 'partially_paid';
        } else {
            // Check if any category due date is overdue
            let hasOverdueCategory = false;
            if (account.feeBreakdown) {
                hasOverdueCategory = account.feeBreakdown.some(
                    (item) => item.balanceAmount > 0 && item.dueDate && now > new Date(item.dueDate)
                );
            }
            account.accountStatus = hasOverdueCategory ? 'overdue' : 'active';
        }
    }
};

module.exports = {
    recalculateAccount
};
