// apps/sm-payment-service/constants/payment.constants.js

const CATEGORY_TYPES = {
    ACADEMIC: 'academic',
    TRANSPORT: 'transport',
    HOSTEL: 'hostel',
    ACTIVITY: 'activity',
    EXAM: 'exam',
    UNIFORM: 'uniform',
    LIBRARY: 'library',
    TECHNOLOGY: 'technology',
    MISCELLANEOUS: 'miscellaneous'
};

const FREQUENCIES = {
    ONE_TIME: 'one_time',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    HALF_YEARLY: 'half_yearly',
    ANNUALLY: 'annually',
    PER_TERM: 'per_term'
};

const STRUCTURE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
};

const ACCOUNT_STATUS = {
    ACTIVE: 'active',
    PAID: 'paid',
    PARTIALLY_PAID: 'partially_paid',
    OVERDUE: 'overdue',
    WAIVED: 'waived',
    FROZEN: 'frozen',
    TRANSFERRED_OUT: 'transferred_out',
    TRANSFERRED_IN: 'transferred_in'
};

const TRANSACTION_TYPES = {
    FEE_ASSIGNED: 'fee_assigned',
    FEE_ITEM_ADDED: 'fee_item_added',
    LATE_FEE_CHARGED: 'late_fee_charged',
    ADJUSTMENT_DEBIT: 'adjustment_debit',
    PAYMENT: 'payment',
    DISCOUNT_APPLIED: 'discount_applied',
    ADJUSTMENT_CREDIT: 'adjustment_credit',
    WAIVER: 'waiver',
    REFUND_ISSUED: 'refund_issued',
    DISCOUNT_REMOVED: 'discount_removed'
};

const PAYMENT_MODES = {
    CASH: 'cash',
    UPI: 'upi',
    CHEQUE: 'cheque',
    BANK_TRANSFER: 'bank_transfer',
    ONLINE: 'online'
};

module.exports = {
    CATEGORY_TYPES,
    FREQUENCIES,
    STRUCTURE_STATUS,
    ACCOUNT_STATUS,
    TRANSACTION_TYPES,
    PAYMENT_MODES
};
