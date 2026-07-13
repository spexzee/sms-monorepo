// packages/shared/models/student-discount.model.js
// Tracks which fee-discount templates have been applied to which students.

const mongoose = require('mongoose');

const StudentDiscountSchema = new mongoose.Schema(
    {
        studentDiscountId: { type: String, required: true, unique: true },
        schoolId:          { type: String, required: true, index: true },
        studentId:         { type: String, required: true },

        // Reference to the FeeDiscount template that was applied
        discountId: { type: String, required: true },

        // Denormalised snapshot at time of application (so template edits don't retroactively change applied amounts)
        discountName:  { type: String, required: true },
        discountType:  { type: String, enum: ['percentage', 'flat'], required: true },
        discountValue: { type: Number, required: true },
        appliesTo:     { type: String, enum: ['all_fees', 'specific_category'], required: true },
        specificCategoryId: { type: String, default: null },

        // Computed INR amount actually waived for this student
        amountWaived:  { type: Number, default: 0 },

        // Links back to the running ledger
        feeAccountId:  { type: String, default: null },

        appliedBy:     { type: String, default: 'system' },
        appliedAt:     { type: Date,   default: Date.now },
        isActive:      { type: Boolean, default: true }
    },
    {
        timestamps: true,
        collection: 'studentdiscounts'
    }
);

StudentDiscountSchema.index({ schoolId: 1, studentId: 1 });
StudentDiscountSchema.index({ schoolId: 1, discountId: 1 });

module.exports = StudentDiscountSchema;
