// packages/shared/models/fee-discount.model.js

const mongoose = require('mongoose');

const FeeDiscountSchema = new mongoose.Schema(
    {
        discountId: { type: String, required: true, unique: true },
        schoolId:   { type: String, required: true, index: true },

        name:        { type: String, required: true, trim: true },
        description: { type: String, default: '' },

        // 'percentage' | 'flat'
        discountType: {
            type: String,
            required: true,
            enum: ['percentage', 'flat']
        },

        // For percentage: 0-100; for flat: absolute INR amount
        discountValue: { type: Number, required: true, min: 0 },

        // 'all_fees' | 'specific_category'
        appliesTo: {
            type: String,
            required: true,
            enum: ['all_fees', 'tuition_only', 'specific_category']
        },

        // Only set when appliesTo === 'specific_category'
        specificCategoryId: { type: String, default: null },

        isActive:  { type: Boolean, default: true },
        createdBy: { type: String, default: 'system' }
    },
    {
        timestamps: true,
        collection: 'feediscounts'
    }
);

FeeDiscountSchema.index({ schoolId: 1, discountId: 1 });
FeeDiscountSchema.index({ schoolId: 1, isActive: 1 });

module.exports = FeeDiscountSchema;
