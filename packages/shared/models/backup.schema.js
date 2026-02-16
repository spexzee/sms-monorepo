const mongoose = require("mongoose");

/**
 * Generic backup schema for storing collection snapshots.
 * Used across all collections in per-school backup databases.
 */
const backupSchema = new mongoose.Schema(
    {
        batchId: {
            type: String,
            required: true,
            unique: true,
        },
        collectionName: {
            type: String,
            required: true,
        },
        performedBy: {
            type: String,
            required: true,
        },
        performedByRole: {
            type: String,
        },
        operationType: {
            type: String,
            enum: ["bulk_insert", "bulk_update", "bulk_delete", "manual", "pre_restore"],
            default: "manual",
        },
        recordCount: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
        },
        snapshot: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
backupSchema.index({ collectionName: 1, createdAt: -1 });

module.exports = backupSchema;
