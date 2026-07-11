// packages/shared/models/fee-category.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * FeeCategory Schema
 *
 * Defines the master list of fee types a school can charge.
 * Each school manages its own categories (multi-tenant via schoolId).
 *
 * Examples:
 *   - "Tuition Fee"    → academic, recurring, mandatory
 *   - "Transport Fee"  → transport, recurring, optional
 *   - "Lab Fee"        → academic, one-time, mandatory
 *   - "Library Fine"   → miscellaneous, one-time, optional
 */
const FeeCategorySchema = new Schema(
    {
        // ── Identity ──────────────────────────────────────────────────
        feeCategoryId: {
            type: String,
            required: [true, 'feeCategoryId is required'],
            unique: true,
            trim: true,
            // Generated as: "FC-" + Date.now().toString(36).toUpperCase() + random
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
            required: [true, 'Category name is required'],
            trim: true,
            minlength: [2, 'Category name must be at least 2 characters'],
            maxlength: [100, 'Category name cannot exceed 100 characters'],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },

        categoryType: {
            type: String,
            required: [true, 'categoryType is required'],
            enum: {
                values: [
                    'academic',       // Tuition, subject fees
                    'transport',      // Bus, van fees
                    'hostel',         // Boarding, accommodation
                    'activity',       // Sports, arts, clubs
                    'exam',           // Exam fees, practical fees
                    'uniform',        // Uniform, dress code
                    'library',        // Library fees, fines
                    'technology',     // Computer lab, device fees
                    'miscellaneous',  // Any other fee type
                    'other',          // Generic fallback
                ],
                message: '{VALUE} is not a valid category type',
            },
        },

        // Whether this fee repeats on a schedule (monthly, quarterly, etc.)
        isRecurring: {
            type: Boolean,
            default: false,
        },

        // Whether all students must pay this (false = optional enrollment)
        isMandatory: {
            type: Boolean,
            default: true,
        },

        // ── Status ────────────────────────────────────────────────────
        isActive: {
            type: Boolean,
            default: true,
            index: true,
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
            type: String,   // adminId
            default: null,
        },
        deletedByName: {
            type: String,
            default: null,
        },

        // ── Audit Fields ──────────────────────────────────────────────
        createdBy: {
            type: String,   // adminId
            required: [true, 'createdBy is required'],
        },
        createdByName: {
            type: String,   // denormalized admin name for fast display
            default: '',
        },
        updatedBy: {
            type: String,   // adminId of last updater
            default: null,
        },
        updatedByName: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt
    }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Enforce unique category names per school (excluding soft-deleted docs)
FeeCategorySchema.index(
    { schoolId: 1, name: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Fast lookup of active categories by school (used in dropdowns)
FeeCategorySchema.index({ schoolId: 1, isActive: 1, isDeleted: 1 });

// Category type filtering for admin list view
FeeCategorySchema.index({ schoolId: 1, categoryType: 1, isDeleted: 1 });

// ── Pre-save Hook ──────────────────────────────────────────────────────────

// Auto-set deletedAt timestamp when soft deleting
FeeCategorySchema.pre('save', async function () {
    if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
        this.deletedAt = new Date();
    }
});

// ── Virtual ────────────────────────────────────────────────────────────────

// Human-readable label combining name + flags (useful for select dropdowns)
FeeCategorySchema.virtual('displayLabel').get(function () {
    const tags = [];
    if (this.isRecurring) tags.push('Recurring');
    if (!this.isMandatory) tags.push('Optional');
    return tags.length ? `${this.name} (${tags.join(', ')})` : this.name;
});

module.exports = FeeCategorySchema;
