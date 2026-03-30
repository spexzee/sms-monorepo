const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * ActivityLog Schema
 * Tracks all administrative and teacher actions across the system.
 */
const ActivityLogSchema = new Schema({
    logId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    actorId: {
        type: String,
        required: true,
        index: true
    },
    actorName: {
        type: String,
        required: true
    },
    actorRole: {
        type: String,
        enum: ['super_admin', 'sch_admin', 'teacher', 'admin'],
        required: true
    },
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'],
        required: true,
        index: true
    },
    entity: {
        type: String,
        required: true,
        index: true
    },
    entityId: {
        type: String,
        required: true,
        index: true
    },
    entityLabel: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, { 
    timestamps: true 
});

// TTL Index: Auto-expire logs after 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for efficient filtering
ActivityLogSchema.index({ schoolId: 1, createdAt: -1 });
ActivityLogSchema.index({ schoolId: 1, entity: 1, action: 1 });
ActivityLogSchema.index({ schoolId: 1, actorId: 1 });

module.exports = ActivityLogSchema;
