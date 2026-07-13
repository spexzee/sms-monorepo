// packages/shared/models/fee-payment.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Embedded Sub-Schemas ───────────────────────────────────────────────────

/**
 * PaymentItemSchema (embedded in FeePayment)
 * Represents the portion of a payment allocated to one fee category,
 * optionally against a specific installment.
 */
const PaymentItemSchema = new Schema(
    {
        feeCategoryId: {
            type: String,
            required: [true, 'feeCategoryId is required in payment item'],
            trim: true,
        },
        categoryName: {
            type: String,
            required: [true, 'categoryName is required in payment item'],
            trim: true,
        },
        // null = not installment-based; number = specific installment being paid
        installmentNumber: {
            type: Number,
            default: null,
        },
        installmentLabel: {
            type: String,
            default: null,
            trim: true,
            // e.g., "Term 1", "Quarter 2"
        },
        // The full outstanding amount for this item at time of payment
        outstandingAmount: {
            type: Number,
            required: [true, 'outstandingAmount is required'],
            min: [0, 'Outstanding amount cannot be negative'],
        },
        // Late fee applicable to this item at time of payment
        lateFeeAmount: {
            type: Number,
            default: 0,
            min: [0, 'Late fee amount cannot be negative'],
        },
        // Actual amount paid toward this item (≤ outstandingAmount + lateFeeAmount)
        paidAmount: {
            type: Number,
            required: [true, 'paidAmount is required'],
            min: [0.01, 'Paid amount must be greater than 0'],
        },
    },
    { _id: false }
);

/**
 * RefundDetailsSchema (embedded in FeePayment)
 * Populated when this payment is partially or fully refunded.
 * A payment can only be refunded once (to prevent double-refund).
 */
const RefundDetailsSchema = new Schema(
    {
        refundedAt: {
            type: Date,
            required: true,
        },
        refundedBy: {
            type: String,   // adminId
            required: true,
        },
        refundedByName: {
            type: String,
            required: true,
        },
        refundAmount: {
            type: Number,
            required: true,
            min: [0.01, 'Refund amount must be greater than 0'],
        },
        refundMode: {
            type: String,
            required: true,
            enum: {
                values: ['cash', 'upi', 'cheque', 'bank_transfer'],
                message: '{VALUE} is not a valid refund mode',
            },
        },
        refundReferenceNumber: {
            type: String,
            trim: true,
            default: '',
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        // The new FeePayment document ID created for the refund record
        refundPaymentId: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

// ── Main Schema ────────────────────────────────────────────────────────────

/**
 * FeePayment Schema
 *
 * Records every payment transaction — and every refund — against a student's
 * fee account. This is the immutable financial transaction log.
 *
 * Design principles:
 *   - NEVER update a completed payment record. Corrections are new transactions.
 *   - Refunds are tracked on the original payment (refundDetails) AND as a
 *     separate FeePayment document with type = 'refund' for the audit trail.
 *   - paymentItems allows partial payments: a student can pay Transport Fee
 *     now and Tuition Fee next week.
 *
 * Payment types:
 *   'payment' → money received from student/parent
 *   'refund'  → money returned to student/parent (links to original payment)
 */
const FeePaymentSchema = new Schema(
    {
        // ── Identity ──────────────────────────────────────────────────
        paymentId: {
            type: String,
            required: [true, 'paymentId is required'],
            unique: true,
            trim: true,
            // Generated as: "PAY-" + Date.now().toString(36).toUpperCase() + random
        },

        schoolId: {
            type: String,
            required: [true, 'schoolId is required'],
            trim: true,
            index: true,
        },

        // ── Payment Type ──────────────────────────────────────────────
        paymentType: {
            type: String,
            required: [true, 'paymentType is required'],
            enum: {
                values: [
                    'payment',  // Standard fee payment
                    'refund',   // Refund issued against a prior payment
                ],
                message: '{VALUE} is not a valid payment type',
            },
            default: 'payment',
            index: true,
        },

        // ── Student & Account Reference ───────────────────────────────
        studentId: {
            type: String,
            required: [true, 'studentId is required'],
            trim: true,
            index: true,
        },
        // Denormalized for display (name doesn't change on this record)
        studentName: {
            type: String,
            required: [true, 'studentName is required'],
            trim: true,
        },
        assignmentId: {
            type: String,
            required: [true, 'assignmentId is required'],
            trim: true,
            // References StudentFeeAssignment.assignmentId
        },
        academicYear: {
            type: String,
            required: [true, 'academicYear is required'],
            trim: true,
            match: [/^\d{4}-\d{4}$/, 'academicYear must be in format YYYY-YYYY'],
        },

        // ── For refund type: link to original payment ──────────────────
        originalPaymentId: {
            type: String,
            default: null,
            trim: true,
            // Required when paymentType = 'refund'
        },

        // ── Payment Mode & Details ────────────────────────────────────
        paymentMode: {
            type: String,
            required: [true, 'paymentMode is required'],
            enum: {
                values: [
                    'cash',             // Physical cash
                    'upi',              // UPI transfer (GPay, PhonePe, etc.)
                    'card',             // POS / credit card / debit card
                    'cheque',           // Physical cheque
                    'bank_transfer',    // NEFT / RTGS / IMPS
                    'online',           // Future: payment gateway (Razorpay, Stripe)
                ],
                message: '{VALUE} is not a valid payment mode',
            },
        },

        // Date the payment was received (not necessarily today)
        paymentDate: {
            type: Date,
            required: [true, 'paymentDate is required'],
        },

        // Cheque/UTR/UPI transaction ID (required for non-cash payments)
        referenceNumber: {
            type: String,
            trim: true,
            default: '',
        },

        // Bank name (for cheque / bank transfer)
        bankName: {
            type: String,
            trim: true,
            default: '',
        },

        // Admin free-text remarks
        remarks: {
            type: String,
            trim: true,
            maxlength: [500, 'Remarks cannot exceed 500 characters'],
            default: '',
        },

        // ── Payment Items ─────────────────────────────────────────────
        paymentItems: {
            type: [PaymentItemSchema],
            required: [true, 'paymentItems is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one payment item is required',
            },
        },

        // ── Financial Summary ─────────────────────────────────────────
        // Sum of all paymentItems[].paidAmount (excludes late fees)
        totalFeeAmount: {
            type: Number,
            required: [true, 'totalFeeAmount is required'],
            min: [0, 'Total fee amount cannot be negative'],
        },
        // Sum of all paymentItems[].lateFeeAmount
        totalLateFee: {
            type: Number,
            default: 0,
            min: [0, 'Total late fee cannot be negative'],
        },
        // totalFeeAmount + totalLateFee — actual money received
        totalAmountReceived: {
            type: Number,
            required: [true, 'totalAmountReceived is required'],
            min: [0.01, 'Total amount received must be greater than 0'],
        },

        // ── Account Snapshot at Time of Payment ───────────────────────
        // Recorded for the receipt and audit trail
        balanceBefore: {
            type: Number,
            required: [true, 'balanceBefore is required'],
        },
        balanceAfter: {
            type: Number,
            required: [true, 'balanceAfter is required'],
        },

        // ── Payment Status ────────────────────────────────────────────
        status: {
            type: String,
            enum: {
                values: [
                    'completed',             // Money received and verified
                    'pending_verification',  // Cheque/transfer not yet cleared
                    'failed',                // Payment bounced or failed (online)
                    'refunded',              // Full amount refunded
                    'partially_refunded',    // Partial amount refunded
                ],
                message: '{VALUE} is not a valid payment status',
            },
            default: 'completed',
            index: true,
        },

        // ── Receipt Link ──────────────────────────────────────────────
        // Set after receipt is generated (may be null briefly between payment + receipt creation)
        receiptId: {
            type: String,
            default: null,
            trim: true,
        },

        // ── Refund Tracking ───────────────────────────────────────────
        // Populated on the ORIGINAL payment document when a refund is issued
        refundDetails: {
            type: RefundDetailsSchema,
            default: null,
        },

        // ── Online Payment Fields (V2 — all optional in V1) ───────────
        gatewayProvider: {
            type: String,
            default: null,
            // e.g., 'razorpay', 'stripe', 'ccavenue'
        },
        gatewayOrderId: {
            type: String,
            default: null,
            trim: true,
        },
        gatewayPaymentId: {
            type: String,
            default: null,
            trim: true,
        },
        gatewaySignature: {
            type: String,
            default: null,
        },
        // Raw gateway response stored for dispute resolution
        gatewayResponse: {
            type: Schema.Types.Mixed,
            default: null,
        },

        // ── Soft Delete ───────────────────────────────────────────────
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: String,
            default: null,
        },
        deletedByName: {
            type: String,
            default: null,
        },

        // ── Audit Fields ──────────────────────────────────────────────
        // createdBy = the admin who recorded the payment
        createdBy: {
            type: String,
            required: [true, 'createdBy (receivedBy) is required'],
        },
        createdByName: {
            type: String,
            default: '',
        },
        updatedBy: {
            type: String,
            default: null,
        },
        updatedByName: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Student payment history (most common query)
FeePaymentSchema.index(
    { schoolId: 1, studentId: 1, paymentDate: -1 },
    { name: 'idx_school_student_date' }
);

// Assignment-level payment history (all payments for one student account)
FeePaymentSchema.index(
    { schoolId: 1, assignmentId: 1, paymentDate: -1 },
    { name: 'idx_school_assignment_date' }
);

// Date-range collection reports
FeePaymentSchema.index(
    { schoolId: 1, paymentDate: -1, paymentType: 1, status: 1 },
    { name: 'idx_school_date_type_status' }
);

// Payment mode breakdown (Cash vs UPI vs Cheque reports)
FeePaymentSchema.index(
    { schoolId: 1, academicYear: 1, paymentMode: 1 },
    { name: 'idx_school_year_mode' }
);

// Receipt lookup
FeePaymentSchema.index({ receiptId: 1 }, { sparse: true });

// Original payment → refund link
FeePaymentSchema.index({ originalPaymentId: 1 }, { sparse: true });

// ── Pre-validate Hook ──────────────────────────────────────────────────────

FeePaymentSchema.pre('validate', async function () {
    // Refund payments must link to an original payment
    if (this.paymentType === 'refund' && !this.originalPaymentId) {
        throw new Error('originalPaymentId is required for refund payments');
    }
    // Non-cash payments should have a reference number
    if (
        ['upi', 'card', 'cheque', 'bank_transfer'].includes(this.paymentMode) &&
        !this.referenceNumber
    ) {
        throw new Error(`referenceNumber is required for ${this.paymentMode} payments`);
    }
    // Payment date cannot be in the future
    if (this.paymentDate && new Date(this.paymentDate) > new Date()) {
        throw new Error('paymentDate cannot be in the future');
    }
});

// ── Pre-save Hook ──────────────────────────────────────────────────────────

FeePaymentSchema.pre('save', async function () {
    // Recompute totalAmountReceived from items
    if (this.isModified('paymentItems')) {
        this.totalFeeAmount = this.paymentItems.reduce(
            (sum, item) => sum + (item.paidAmount || 0),
            0
        );
        this.totalLateFee = this.paymentItems.reduce(
            (sum, item) => sum + (item.lateFeeAmount || 0),
            0
        );
        this.totalAmountReceived = this.totalFeeAmount + this.totalLateFee;
    }

    // Set deletedAt when soft deleting
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});

// ── Virtuals ───────────────────────────────────────────────────────────────

// Whether this payment is eligible for a refund
FeePaymentSchema.virtual('isRefundable').get(function () {
    return (
        this.paymentType === 'payment' &&
        this.status === 'completed' &&
        !this.refundDetails &&
        !this.isDeleted
    );
});

// Human-readable payment mode label
FeePaymentSchema.virtual('paymentModeLabel').get(function () {
    const labels = {
        cash: 'Cash',
        upi: 'UPI',
        cheque: 'Cheque',
        bank_transfer: 'Bank Transfer',
        online: 'Online Payment',
    };
    return labels[this.paymentMode] || this.paymentMode;
});

module.exports = FeePaymentSchema;
