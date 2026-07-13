const mongoose = require("mongoose");
const { Schema } = mongoose;

const PromotionLogSchema = new Schema(
    {
        schoolId: {
            type: String,
            required: true,
            index: true,
        },
        academicYear: {
            type: String,
            required: true,
        },
        promotedBy: {
            type: String,
            required: true,
        },
        promotionType: {
            type: String,
            enum: ["single_class", "bulk", "repeat", "graduate", "archive"],
            required: true,
        },
        classId: {
            type: String,
        },
        targetClassId: {
            type: String,
        },
        students: [
            {
                studentId: { type: String, required: true },
                fromClass: { type: String },
                fromSection: { type: String },
                toClass: { type: String },
                toSection: { type: String },
                status: {
                    type: String,
                    enum: ["promoted", "repeated", "graduated"],
                },
            },
        ],
        status: {
            type: String,
            enum: ["pending", "completed", "rolled_back"],
            default: "completed",
        },
        rollbackAvailable: {
            type: Boolean,
            default: true,
        },
        notes: {
            type: String,
        },
        executedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = PromotionLogSchema;
