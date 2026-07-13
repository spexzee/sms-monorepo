// packages/shared/models/fee-receipt.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Embedded Sub-Schemas ───────────────────────────────────────────────────

/**
 * ReceiptLineItemSchema (embedded in FeeReceipt)
 * A copy of each payment item formatted for receipt display.
 * Stored as a snapshot — independent of any future data changes.
 */
const ReceiptLineItemSchema = new Schema(
    {
        // Human-readable description shown on the receipt
        // e.g., "Tuition Fee — Term 1", "Transport Fee (Annual)"
        description: {
            type: String,
            required: true,
            trim: true,
        },
        feeCategoryId: {
            type: String,
            trim: true,
            default: '',
        },
        installmentLabel: {
            type: String,
            trim: true,
            default: null,
        },
        // Base fee amount for this line item
        feeAmount: {
            type: Number,
            required: true,
            min: [0, 'Fee amount cannot be negative'],
        },
        // Late fee charged for this line item (0 if none)
        lateFeeAmount: {
            type: Number,
            default: 0,
            min: [0],
        },
        // feeAmount + lateFeeAmount
        lineTotal: {
            type: Number,
            required: true,
            min: [0],
        },
    },
    { _id: false }
);

/**
 * StudentSnapshotSchema (embedded in FeeReceipt)
 * Point-in-time snapshot of student data captured at receipt generation.
 * Ensures the receipt remains accurate even if student data changes later.
 */
const StudentSnapshotSchema = new Schema(
    {
        studentId:   { type: String, required: true },
        studentName: { type: String, required: true },
        className:   { type: String, default: '' },
        sectionName: { type: String, default: '' },
        rollNumber:  { type: String, default: '' },
    },
    { _id: false }
);

/**
 * SchoolSnapshotSchema (embedded in FeeReceipt)
 * Point-in-time snapshot of school info for the receipt header/footer.
 * Preserves legal accuracy even if school details are updated later.
 */
const SchoolSnapshotSchema = new Schema(
    {
        schoolId:      { type: String, required: true },
        schoolName:    { type: String, required: true },
        schoolAddress: { type: String, default: '' },
        schoolPhone:   { type: String, default: '' },
        schoolEmail:   { type: String, default: '' },
        schoolLogo:    { type: String, default: '' }, // URL
    },
    { _id: false }
);

/**
 * FeeReceiptCounterSchema
 *
 * Separate collection used to generate sequential, gapless receipt numbers.
 * One document per (schoolId + academicYear) pair.
 *
 * Used with: findOneAndUpdate + $inc for atomicity under concurrent requests.
 *
 * Receipt number format: "SMS/2026-27/000001"
 */
const FeeReceiptCounterSchema = new Schema(
    {
        schoolId: {
            type: String,
            required: [true, 'schoolId is required'],
            trim: true,
        },
        academicYear: {
            type: String,
            required: [true, 'academicYear is required'],
            trim: true,
            // Format: "YYYY-YYYY" (e.g., "2025-2026")
        },
        // Atomically incremented with $inc — never manually updated
        lastNumber: {
            type: Number,
            default: 0,
            min: [0, 'lastNumber cannot be negative'],
        },
    },
    {
        timestamps: true,
    }
);

// Unique per school per year — resets automatically at year boundary
FeeReceiptCounterSchema.index(
    { schoolId: 1, academicYear: 1 },
    { unique: true, name: 'idx_receipt_counter_unique' }
);

// ── Main Receipt Schema ────────────────────────────────────────────────────

/**
 * FeeReceipt Schema
 *
 * A self-contained, point-in-time receipt document generated for every
 * successful fee payment. Designed as a legal financial document:
 *
 *   - NEVER deleted, even if the related payment is refunded
 *   - isVoided flag marks receipts whose payment was reversed
 *   - All display data is snapshotted (student name, school name, amounts)
 *     so the receipt remains accurate indefinitely
 *
 * Receipt number format: "SMS/YYYY-YY/000001"
 *   - "SMS"        → fixed system prefix
 *   - "YYYY-YY"   → short academic year (e.g., 2026-27)
 *   - "000001"    → 6-digit zero-padded sequential counter
 *   The counter resets to 1 every new academic year per school.
 */
const FeeReceiptSchema = new Schema(
    {
        // ── Identity ──────────────────────────────────────────────────
        receiptId: {
            type: String,
            required: [true, 'receiptId is required'],
            unique: true,
            trim: true,
            // Generated as: "RCP-" + Date.now().toString(36).toUpperCase() + random
        },

        // Human-readable sequential number (used on the printed/PDF receipt)
        // Format: "SMS/2026-27/000001"
        receiptNumber: {
            type: String,
            required: [true, 'receiptNumber is required'],
            trim: true,
            // Unique per school per academic year
        },

        schoolId: {
            type: String,
            required: [true, 'schoolId is required'],
            trim: true,
            index: true,
        },

        academicYear: {
            type: String,
            required: [true, 'academicYear is required'],
            trim: true,
            match: [/^\d{4}-\d{4}$/, 'academicYear must be in format YYYY-YYYY'],
        },

        // ── Payment Reference ─────────────────────────────────────────
        paymentId: {
            type: String,
            required: [true, 'paymentId is required'],
            trim: true,
            // References FeePayment.paymentId
            index: true,
        },

        assignmentId: {
            type: String,
            required: [true, 'assignmentId is required'],
            trim: true,
            // References StudentFeeAssignment.assignmentId
        },

        // ── Snapshots (point-in-time, never auto-updated) ─────────────
        student: {
            type: StudentSnapshotSchema,
            required: [true, 'Student snapshot is required'],
        },

        school: {
            type: SchoolSnapshotSchema,
            required: [true, 'School snapshot is required'],
        },

        // ── Payment Details (copied from FeePayment at generation time) ─
        paymentDate: {
            type: Date,
            required: [true, 'paymentDate is required'],
        },

        paymentMode: {
            type: String,
            required: [true, 'paymentMode is required'],
            enum: {
                values: ['cash', 'upi', 'cheque', 'bank_transfer', 'online'],
                message: '{VALUE} is not a valid payment mode',
            },
        },

        referenceNumber: {
            type: String,
            trim: true,
            default: '',
        },

        bankName: {
            type: String,
            trim: true,
            default: '',
        },

        // ── Line Items (what was paid) ─────────────────────────────────
        lineItems: {
            type: [ReceiptLineItemSchema],
            required: [true, 'lineItems is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one line item is required',
            },
        },

        // ── Financial Summary ─────────────────────────────────────────
        totalFeeAmount: {
            type: Number,
            required: [true, 'totalFeeAmount is required'],
            min: [0],
        },
        totalLateFeeIncluded: {
            type: Number,
            default: 0,
            min: [0],
        },
        // The grand total shown prominently on the receipt
        totalAmountPaid: {
            type: Number,
            required: [true, 'totalAmountPaid is required'],
            min: [0.01, 'Total amount paid must be greater than 0'],
        },

        // ── Account Balance Snapshot ──────────────────────────────────
        // Captured at time of payment for "Remaining Balance" on receipt
        totalFeesForYear: {
            type: Number,
            required: [true, 'totalFeesForYear is required'],
            min: [0],
            // = StudentFeeAssignment.netFees at time of payment
        },
        totalPaidToDate: {
            type: Number,
            required: [true, 'totalPaidToDate is required'],
            min: [0],
            // = StudentFeeAssignment.totalPaid AFTER this payment
        },
        balanceRemaining: {
            type: Number,
            required: [true, 'balanceRemaining is required'],
            // = StudentFeeAssignment.totalBalance AFTER this payment
            // Can be 0 (fully paid) or > 0 (partial payment)
        },

        // ── Receipt State ─────────────────────────────────────────────
        // A receipt is NEVER deleted. When its payment is refunded,
        // isVoided is set to true and the reason is recorded.
        isVoided: {
            type: Boolean,
            default: false,
            index: true,
        },
        voidedAt: {
            type: Date,
            default: null,
        },
        voidedBy: {
            type: String,   // adminId
            default: null,
        },
        voidedByName: {
            type: String,
            default: null,
        },
        voidReason: {
            type: String,
            trim: true,
            default: null,
        },

        // ── PDF Storage ───────────────────────────────────────────────
        // URL of the generated PDF stored on cloud storage (optional)
        // If null, PDF is generated on-demand each time
        pdfUrl: {
            type: String,
            trim: true,
            default: null,
        },
        pdfGeneratedAt: {
            type: Date,
            default: null,
        },

        // ── Soft Delete ───────────────────────────────────────────────
        // Note: soft delete here is an ADMIN OVERRIDE for corrupt records only.
        // Normal receipt lifecycle uses isVoided, not isDeleted.
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
        // createdBy = admin who triggered the payment recording
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

// Unique receipt number per school per academic year
FeeReceiptSchema.index(
    { schoolId: 1, academicYear: 1, receiptNumber: 1 },
    { unique: true, name: 'idx_receipt_number_unique' }
);

// Student receipt history (most common parent/student query)
FeeReceiptSchema.index(
    { schoolId: 1, 'student.studentId': 1, paymentDate: -1 },
    { name: 'idx_school_student_date' }
);

// Admin search by date range
FeeReceiptSchema.index(
    { schoolId: 1, paymentDate: -1, isVoided: 1 },
    { name: 'idx_school_date_void' }
);

// Payment → receipt link (one-to-one)
FeeReceiptSchema.index(
    { paymentId: 1 },
    { unique: true, name: 'idx_payment_receipt_unique' }
);

// ── Pre-save Hook ──────────────────────────────────────────────────────────

FeeReceiptSchema.pre('save', async function () {
    // Recompute lineItem totals for consistency
    if (this.isModified('lineItems')) {
        this.totalFeeAmount = this.lineItems.reduce(
            (sum, item) => sum + (item.feeAmount || 0),
            0
        );
        this.totalLateFeeIncluded = this.lineItems.reduce(
            (sum, item) => sum + (item.lateFeeAmount || 0),
            0
        );
        this.totalAmountPaid = this.totalFeeAmount + this.totalLateFeeIncluded;
    }

    // Set voidedAt when voiding
    if (this.isModified('isVoided') && this.isVoided && !this.voidedAt) {
        this.voidedAt = new Date();
    }

    // Set deletedAt when soft deleting
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});

// ── Virtuals ───────────────────────────────────────────────────────────────

// Whether this receipt is currently valid (not voided, not deleted)
FeeReceiptSchema.virtual('isValid').get(function () {
    return !this.isVoided && !this.isDeleted;
});

// Short academic year for display in the receipt number
FeeReceiptSchema.virtual('academicYearShort').get(function () {
    if (!this.academicYear) return '';
    const [startYear, endYear] = this.academicYear.split('-');
    return `${startYear}-${endYear.slice(2)}`;
});

module.exports = {
    FeeReceiptSchema,
    FeeReceiptCounterSchema,
};
