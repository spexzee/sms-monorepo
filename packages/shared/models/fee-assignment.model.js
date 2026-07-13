// packages/shared/models/fee-assignment.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Embedded Sub-Schemas ───────────────────────────────────────────────────

/**
 * FeeLineItemSchema (embedded in StudentFeeAssignment)
 * One entry per fee category included in the structure.
 * Tracks the complete financial state of a single fee category for this student.
 *
 * Balance formula (always maintained by the controller):
 *   balanceAmount = netAmount + lateFeeCharged - paidAmount + refundedAmount
 */
const FeeLineItemSchema = new Schema(
    {
        feeCategoryId: {
            type: String,
            required: true,
            trim: true,
        },
        categoryName: {
            type: String,
            required: true,
            trim: true,
        },
        categoryType: {
            type: String,
            default: '',
        },

        // ── Amount Layers (in order of application) ──
        // 1. Original amount from the fee structure (never changes)
        originalAmount: {
            type: Number,
            required: true,
            min: [0, 'Original amount cannot be negative'],
        },
        // 2. Net adjustments: adjustment_debit - adjustment_credit
        adjustments: {
            type: Number,
            default: 0,
            // Can be negative (net credit) or positive (net debit)
        },
        // 3. Total discounts applied (scholarships, sibling, staff)
        discountAmount: {
            type: Number,
            default: 0,
            min: [0, 'Discount amount cannot be negative'],
        },
        // 4. Amount formally waived
        waivedAmount: {
            type: Number,
            default: 0,
            min: [0, 'Waived amount cannot be negative'],
        },
        // 5. What the student actually owes after all credits
        //    = originalAmount + adjustments - discountAmount - waivedAmount
        netAmount: {
            type: Number,
            default: 0,
        },
        // 6. Running total of all payments received for this item
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, 'Paid amount cannot be negative'],
        },
        // 7. Running total of all refunds issued for this item
        refundedAmount: {
            type: Number,
            default: 0,
            min: [0, 'Refunded amount cannot be negative'],
        },
        // 8. Accumulated late fees for this item
        lateFeeCharged: {
            type: Number,
            default: 0,
            min: [0, 'Late fee cannot be negative'],
        },
        // 9. Final outstanding balance for this item
        //    = netAmount + lateFeeCharged - paidAmount + refundedAmount
        balanceAmount: {
            type: Number,
            default: 0,
        },

        // Due date for this fee item (computed from structure's dueDayOfMonth)
        dueDate: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: {
                values: ['unpaid', 'partial', 'paid', 'waived', 'refunded'],
                message: '{VALUE} is not a valid line item status',
            },
            default: 'unpaid',
        },
    },
    { _id: false }
);

/**
 * InstallmentRecordSchema (embedded in StudentFeeAssignment)
 * Tracks payment progress per installment (only if installment plan is enabled).
 */
const InstallmentRecordSchema = new Schema(
    {
        installmentNumber: {
            type: Number,
            required: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        // Total amount due for this installment (computed at assignment time)
        totalAmount: {
            type: Number,
            required: true,
            min: [0, 'Installment total amount cannot be negative'],
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, 'Installment paid amount cannot be negative'],
        },
        balanceAmount: {
            type: Number,
            default: 0,
        },
        // Late fee accumulated specifically for this installment
        lateFeeApplied: {
            type: Number,
            default: 0,
            min: [0, 'Late fee cannot be negative'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'partial', 'paid', 'overdue'],
                message: '{VALUE} is not a valid installment status',
            },
            default: 'pending',
        },
    },
    { _id: false }
);

/**
 * ProRataConfigSchema (embedded in StudentFeeAssignment)
 * Used when a student joins mid-year and fees are adjusted accordingly.
 */
const ProRataConfigSchema = new Schema(
    {
        admissionDate: {
            type: Date,
            required: true,
        },
        // What the full-year fee would have been (before pro-rata)
        originalTotalFees: {
            type: Number,
            required: true,
            min: [0],
        },
        // Human-readable reason for the pro-rata adjustment
        reason: {
            type: String,
            trim: true,
            default: 'Mid-year admission',
        },
    },
    { _id: false }
);

// ── Main Schema ────────────────────────────────────────────────────────────

/**
 * StudentFeeAssignment Schema
 *
 * The running ledger for one student for one academic year.
 * Created when a FeeStructure is assigned to a student.
 *
 * UNIQUE CONSTRAINT: one document per (schoolId + studentId + academicYear).
 *
 * This is the single source of truth for a student's financial position.
 * Every payment, discount, adjustment, or waiver updates this document
 * AND creates an immutable FeePayment record for audit.
 *
 * Balance formula:
 *   totalBalance = netFees + totalLateFee - totalPaid + totalRefunded
 */
const StudentFeeAssignmentSchema = new Schema(
    {
        // ── Identity ──────────────────────────────────────────────────
        assignmentId: {
            type: String,
            required: [true, 'assignmentId is required'],
            unique: true,
            trim: true,
            // Generated as: "SFA-" + Date.now().toString(36).toUpperCase() + random
        },

        schoolId: {
            type: String,
            required: [true, 'schoolId is required'],
            trim: true,
            index: true,
        },

        // ── Student Snapshot ──────────────────────────────────────────
        // Denormalized at time of assignment for self-contained queries.
        // These values do NOT auto-update if the student's record changes.
        studentId: {
            type: String,
            required: [true, 'studentId is required'],
            trim: true,
        },
        studentName: {
            type: String,
            required: [true, 'studentName is required'],
            trim: true,
        },
        classId: {
            type: String,
            required: [true, 'classId is required'],
            trim: true,
        },
        className: {
            type: String,
            default: '',
            trim: true,
        },
        sectionId: {
            type: String,
            default: '',
            trim: true,
        },
        sectionName: {
            type: String,
            default: '',
            trim: true,
        },
        rollNumber: {
            type: String,
            default: '',
            trim: true,
        },

        // ── Academic Year ─────────────────────────────────────────────
        academicYear: {
            type: String,
            required: [true, 'academicYear is required'],
            trim: true,
            match: [/^\d{4}-\d{4}$/, 'academicYear must be in format YYYY-YYYY'],
        },

        // ── Structure Reference ───────────────────────────────────────
        feeStructureId: {
            type: String,
            required: [true, 'feeStructureId is required'],
            trim: true,
        },
        feeStructureName: {
            type: String,
            default: '',
            trim: true,
        },

        // ── Fee Breakdown (one entry per fee category) ─────────────────
        feeBreakdown: {
            type: [FeeLineItemSchema],
            default: [],
        },

        // ── Installment Schedule ──────────────────────────────────────
        // Populated only when the assigned structure has installmentEnabled = true
        installmentSchedule: {
            type: [InstallmentRecordSchema],
            default: [],
        },

        // ── Running Financial Totals ──────────────────────────────────
        // All totals are kept in sync with every transaction.
        // Never derive totals by summing sub-arrays at query time.

        // Sum of all feeItem originalAmounts (from the structure)
        totalOriginalFees: {
            type: Number,
            default: 0,
            min: [0],
        },
        // Net adjustments: sum of all adjustment_debit - adjustment_credit transactions
        totalAdjustments: {
            type: Number,
            default: 0,
            // Can be negative (net credit applied)
        },
        // Sum of all discount amounts applied
        totalDiscount: {
            type: Number,
            default: 0,
            min: [0],
        },
        // Sum of all amounts formally waived
        totalWaived: {
            type: Number,
            default: 0,
            min: [0],
        },
        // What the student actually owes after all deductions
        // = totalOriginalFees + totalAdjustments - totalDiscount - totalWaived
        netFees: {
            type: Number,
            default: 0,
        },
        // Sum of all payments received
        totalPaid: {
            type: Number,
            default: 0,
            min: [0],
        },
        // Sum of all refunds issued
        totalRefunded: {
            type: Number,
            default: 0,
            min: [0],
        },
        // Accumulated late fee charges
        totalLateFee: {
            type: Number,
            default: 0,
            min: [0],
        },
        // Current outstanding balance
        // = netFees + totalLateFee - totalPaid + totalRefunded
        totalBalance: {
            type: Number,
            default: 0,
        },

        // ── Account Status ────────────────────────────────────────────
        accountStatus: {
            type: String,
            enum: {
                values: [
                    'active',            // Ongoing, payments expected
                    'paid',              // Fully paid (totalBalance = 0)
                    'partially_paid',    // Some payments made, balance remains
                    'overdue',           // Past due date with outstanding balance
                    'waived',            // Outstanding balance written off
                    'frozen',            // Locked by admin (dispute, investigation)
                    'transferred_out',   // Student left this school
                    'transferred_in',    // Student joined from another school
                ],
                message: '{VALUE} is not a valid account status',
            },
            default: 'active',
            index: true,
        },

        // ── Activity Tracking ─────────────────────────────────────────
        lastTransactionDate: {
            type: Date,
            default: null,
        },
        lastTransactionType: {
            type: String,
            default: null,
            // e.g., 'payment', 'discount_applied', 'adjustment_credit'
        },

        // ── Mid-Year Admission Fields ─────────────────────────────────
        isProRata: {
            type: Boolean,
            default: false,
        },
        proRataConfig: {
            type: ProRataConfigSchema,
            default: null,
        },

        // ── Transfer Fields ───────────────────────────────────────────
        transferredFromSchool: {
            type: String,   // schoolId of origin (for transferred_in)
            default: null,
        },
        transferredToSchool: {
            type: String,   // schoolId of destination (for transferred_out)
            default: null,
        },
        transferDate: {
            type: Date,
            default: null,
        },
        transferNote: {
            type: String,
            trim: true,
            default: '',
        },

        // ── Admin Notes ───────────────────────────────────────────────
        adminNotes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
            default: '',
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
        createdBy: {
            type: String,
            required: [true, 'createdBy is required'],
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

// PRIMARY: enforce one account per student per academic year per school
StudentFeeAssignmentSchema.index(
    { schoolId: 1, studentId: 1, academicYear: 1 },
    { unique: true, name: 'idx_unique_student_year' }
);

// Defaulters and overdue queries
StudentFeeAssignmentSchema.index(
    { schoolId: 1, accountStatus: 1, isDeleted: 1 },
    { name: 'idx_school_status' }
);

// Class-wise fee status table (admin view)
StudentFeeAssignmentSchema.index(
    { schoolId: 1, classId: 1, academicYear: 1, isDeleted: 1 },
    { name: 'idx_school_class_year' }
);

// Structure-level queries (how many students on a structure)
StudentFeeAssignmentSchema.index(
    { schoolId: 1, feeStructureId: 1, academicYear: 1 },
    { name: 'idx_school_structure_year' }
);

// ── Pre-save Hook ──────────────────────────────────────────────────────────

StudentFeeAssignmentSchema.pre('save', async function () {
    // Recompute netFees and totalBalance to prevent drift
    if (
        this.isModified('totalOriginalFees') ||
        this.isModified('totalAdjustments') ||
        this.isModified('totalDiscount') ||
        this.isModified('totalWaived') ||
        this.isModified('totalPaid') ||
        this.isModified('totalRefunded') ||
        this.isModified('totalLateFee')
    ) {
        this.netFees =
            this.totalOriginalFees +
            this.totalAdjustments -
            this.totalDiscount -
            this.totalWaived;

        this.totalBalance =
            this.netFees + this.totalLateFee - this.totalPaid + this.totalRefunded;
    }

    // Auto-set accountStatus based on balance
    if (this.isModified('totalBalance') || this.isModified('accountStatus')) {
        // Only auto-update if not in a terminal/manual state
        const manualStatuses = ['frozen', 'transferred_out', 'transferred_in', 'waived'];
        if (!manualStatuses.includes(this.accountStatus)) {
            if (this.totalBalance <= 0) {
                this.accountStatus = 'paid';
            } else if (this.totalPaid > 0 && this.totalBalance > 0) {
                this.accountStatus = 'partially_paid';
            } else if (this.totalPaid === 0 && this.totalBalance > 0) {
                this.accountStatus = 'active';
            }
        }
    }

    // Set deletedAt when soft deleting
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});

// ── Virtuals ───────────────────────────────────────────────────────────────

// Collection percentage (paid vs net fees)
StudentFeeAssignmentSchema.virtual('collectionPercentage').get(function () {
    if (!this.netFees || this.netFees === 0) return 100;
    return Math.min(100, Math.round((this.totalPaid / this.netFees) * 100));
});

// Whether admin can record new payments on this account
StudentFeeAssignmentSchema.virtual('canAcceptPayment').get(function () {
    return (
        !this.isDeleted &&
        this.totalBalance > 0 &&
        !['frozen', 'transferred_out', 'paid', 'waived'].includes(this.accountStatus)
    );
});

module.exports = StudentFeeAssignmentSchema;
