// packages/shared/models/fee-structure.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Embedded Sub-Schemas ───────────────────────────────────────────────────

/**
 * FeeItemSchema (embedded in FeeStructure)
 * One entry per fee category included in this structure.
 */
const FeeItemSchema = new Schema(
    {
        feeCategoryId: {
            type: String,
            required: [true, 'feeCategoryId is required in fee item'],
            trim: true,
        },
        // Denormalized: stored so the structure is self-contained even if
        // the category name changes later
        categoryName: {
            type: String,
            required: [true, 'categoryName is required in fee item'],
            trim: true,
        },
        categoryType: {
            type: String,
            trim: true,
            default: '',
        },
        amount: {
            type: Number,
            required: [true, 'Fee amount is required'],
            min: [0.01, 'Fee amount must be greater than 0'],
        },
        frequency: {
            type: String,
            required: [true, 'Fee frequency is required'],
            enum: {
                values: [
                    'one_time',     // Paid once per year (e.g., admission, uniform)
                    'monthly',      // Every month
                    'quarterly',    // Every 3 months (4 times a year)
                    'half_yearly',  // Twice a year
                    'annually',     // Once per academic year
                    'per_term',     // Per school term (2–4 terms)
                ],
                message: '{VALUE} is not a valid frequency',
            },
        },
        // Day of the month when this fee is due (1–28 to be safe across months)
        dueDayOfMonth: {
            type: Number,
            min: [1, 'Due day must be between 1 and 28'],
            max: [28, 'Due day must be between 1 and 28'],
            default: 10,
        },
        // If true, individual students can opt out of this fee item
        isOptional: {
            type: Boolean,
            default: false,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
    },
    { _id: false } // no separate _id for embedded documents
);

/**
 * InstallmentPlanSchema (embedded in FeeStructure)
 * Defines one installment in a multi-installment payment plan.
 * All installments' percentageOfTotal must sum to 100.
 */
const InstallmentPlanSchema = new Schema(
    {
        installmentNumber: {
            type: Number,
            required: [true, 'installmentNumber is required'],
            min: [1, 'Installment number must be at least 1'],
        },
        label: {
            type: String,
            required: [true, 'Installment label is required'],
            trim: true,
            // e.g., "Term 1", "Quarter 1", "April–June"
        },
        dueDate: {
            type: Date,
            required: [true, 'Installment due date is required'],
        },
        percentageOfTotal: {
            type: Number,
            required: [true, 'Percentage of total is required'],
            min: [1, 'Percentage must be at least 1'],
            max: [100, 'Percentage cannot exceed 100'],
        },
        // Computed by controller: (totalFees * percentageOfTotal) / 100
        // Stored for fast display without re-calculation
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Installment amount cannot be negative'],
        },
    },
    { _id: false }
);

/**
 * LateFeeRuleSchema (embedded in FeeStructure)
 * Configures automatic late fee penalties.
 */
const LateFeeRuleSchema = new Schema(
    {
        // Number of days after due date before penalty kicks in (0 = immediate)
        gracePeriodDays: {
            type: Number,
            required: [true, 'gracePeriodDays is required'],
            min: [0, 'Grace period cannot be negative'],
            default: 0,
        },
        lateFeeType: {
            type: String,
            required: [true, 'lateFeeType is required'],
            enum: {
                values: ['flat', 'percentage'],
                message: '{VALUE} is not a valid late fee type',
            },
        },
        // Flat amount (e.g., ₹50) or percentage of outstanding (e.g., 2%)
        lateFeeValue: {
            type: Number,
            required: [true, 'lateFeeValue is required'],
            min: [0.01, 'Late fee value must be greater than 0'],
        },
        lateFeeFrequency: {
            type: String,
            required: [true, 'lateFeeFrequency is required'],
            enum: {
                values: [
                    'once',      // Applied one time after grace period
                    'one_time',  // Alias for 'once' (accepted from frontend)
                    'daily',     // Compounded every day
                    'weekly',    // Compounded every week
                    'monthly',   // Compounded every month
                ],
                message: '{VALUE} is not a valid late fee frequency',
            },
        },
        // Hard cap to prevent penalties from spiraling — optional (null = no cap)
        maxLateFeeAmount: {
            type: Number,
            default: null,
            min: [0, 'Max late fee cannot be negative'],
        },
    },
    { _id: false }
);

// ── Main Schema ────────────────────────────────────────────────────────────

/**
 * FeeStructure Schema
 *
 * Defines the fee template for a class (or set of classes) for an academic year.
 * Once published (status = 'published'), the document is IMMUTABLE to preserve
 * data integrity of all student fee assignments made from this structure.
 *
 * Lifecycle: draft → published → archived
 */
const FeeStructureSchema = new Schema(
    {
        // ── Identity ──────────────────────────────────────────────────
        feeStructureId: {
            type: String,
            required: [true, 'feeStructureId is required'],
            unique: true,
            trim: true,
            // Generated as: "FS-" + Date.now().toString(36).toUpperCase() + random
        },

        schoolId: {
            type: String,
            required: [true, 'schoolId is required'],
            trim: true,
            index: true,
        },

        // ── Core Fields ───────────────────────────────────────────────
        name: {
            type: String,
            required: [true, 'Structure name is required'],
            trim: true,
            maxlength: [150, 'Structure name cannot exceed 150 characters'],
            // e.g., "Grade 9 — Academic Year 2025-26"
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },

        // Format: "YYYY-YYYY" (e.g., "2025-2026")
        academicYear: {
            type: String,
            required: [true, 'academicYear is required'],
            trim: true,
            match: [
                /^\d{4}-\d{4}$/,
                'academicYear must be in format YYYY-YYYY (e.g., 2025-2026)',
            ],
        },

        // Class IDs this structure applies to
        applicableClasses: {
            type: [String],
            required: [true, 'applicableClasses is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one class must be specified',
            },
        },

        // ── Fee Items ─────────────────────────────────────────────────
        feeItems: {
            type: [FeeItemSchema],
            required: [true, 'feeItems is required'],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one fee item is required',
            },
        },

        // ── Installment Plan ──────────────────────────────────────────
        installmentEnabled: {
            type: Boolean,
            default: false,
        },

        installments: {
            type: [InstallmentPlanSchema],
            default: [],
            // Validated in pre-validate hook: percentages must sum to 100
        },

        // ── Late Fee Configuration ────────────────────────────────────
        lateFeeEnabled: {
            type: Boolean,
            default: false,
        },

        lateFeeRule: {
            type: LateFeeRuleSchema,
            default: null,
        },

        // ── Lifecycle Status ──────────────────────────────────────────
        status: {
            type: String,
            enum: {
                values: [
                    'draft',      // Editable; not yet visible to students
                    'published',  // IMMUTABLE; can be assigned to students
                    'archived',   // No new assignments; historical reference
                ],
                message: '{VALUE} is not a valid status',
            },
            default: 'draft',
            index: true,
        },

        publishedAt: {
            type: Date,
            default: null,
        },
        publishedBy: {
            type: String,   // adminId
            default: null,
        },
        publishedByName: {
            type: String,
            default: null,
        },

        archivedAt: {
            type: Date,
            default: null,
        },
        archivedBy: {
            type: String,
            default: null,
        },

        // ── Computed Totals (denormalized for fast reads) ─────────────
        // Sum of all feeItem.amount values (before any discounts)
        totalFeeAmount: {
            type: Number,
            default: 0,
            min: [0, 'Total fee amount cannot be negative'],
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

// Primary operational index: filter by school + year + status
FeeStructureSchema.index({ schoolId: 1, academicYear: 1, status: 1 });

// Find published structures for a specific class
FeeStructureSchema.index(
    { schoolId: 1, applicableClasses: 1, academicYear: 1, status: 1 },
    { name: 'idx_school_class_year_status' }
);

// Soft-delete filter
FeeStructureSchema.index({ schoolId: 1, isDeleted: 1 });

// ── Pre-validate Hook ──────────────────────────────────────────────────────

FeeStructureSchema.pre('validate', async function () {
    // 1. Validate installments if enabled
    if (this.installmentEnabled && this.installments.length > 0) {
        const totalPercentage = this.installments.reduce(
            (sum, inst) => sum + (inst.percentageOfTotal || 0),
            0
        );
        if (Math.round(totalPercentage) !== 100) {
            throw new Error(
                `Installment percentages must sum to 100. Current sum: ${totalPercentage}`
            );
        }
        // Validate chronological order
        for (let i = 1; i < this.installments.length; i++) {
            if (
                new Date(this.installments[i].dueDate) <=
                new Date(this.installments[i - 1].dueDate)
            ) {
                throw new Error(
                    `Installment due dates must be in chronological order (installment ${i + 1})`
                );
            }
        }
    }

    // 2. Validate academic year end > start
    if (this.academicYear) {
        const [startYear, endYear] = this.academicYear.split('-').map(Number);
        if (endYear !== startYear + 1) {
            throw new Error(
                `academicYear end year must be exactly 1 year after start year (e.g., 2025-2026)`
            );
        }
    }
});

// ── Pre-save Hook ──────────────────────────────────────────────────────────

FeeStructureSchema.pre('save', async function () {
    // Recompute totalFeeAmount from feeItems on every save
    if (this.isModified('feeItems')) {
        this.totalFeeAmount = this.feeItems.reduce(
            (sum, item) => sum + (item.amount || 0),
            0
        );
    }

    // Set publishedAt timestamp when status transitions to 'published'
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    // Set archivedAt timestamp when status transitions to 'archived'
    if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
        this.archivedAt = new Date();
    }

    // Set deletedAt when soft deleting
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});

// ── Virtuals ────────────────────────────────────────────────────────────────

// Short academic year string for receipt numbers (e.g., "2025-26")
FeeStructureSchema.virtual('academicYearShort').get(function () {
    if (!this.academicYear) return '';
    const [, endYear] = this.academicYear.split('-');
    return `${this.academicYear.slice(0, 4)}-${endYear.slice(2)}`;
});

// Whether the structure is still editable
FeeStructureSchema.virtual('isEditable').get(function () {
    return this.status === 'draft' && !this.isDeleted;
});

module.exports = FeeStructureSchema;
