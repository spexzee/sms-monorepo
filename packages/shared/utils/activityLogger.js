const { ActivityLogSchema } = require("../models");

/**
 * Log an activity to the school's database
 * 
 * @param {Object} params - Logging parameters
 * @param {Object} params.schoolDb - The school's database connection
 * @param {string} params.schoolId - The school's ID
 * @param {Object} params.actor - The user performing the action (from req.user)
 * @param {string} params.action - Action type: 'CREATE', 'UPDATE', 'DELETE', etc.
 * @param {string} params.entity - Affected entity: 'Student', 'Teacher', 'Class', etc.
 * @param {string} params.entityId - ID of the affected record
 * @param {string} params.entityLabel - Human-readable label (e.g. "Ravi Kumar (STU001)")
 * @param {string} params.description - Descriptive text for the log
 * @param {Object} params.metadata - Optional additional data
 */
const logActivity = async ({
    schoolDb,
    schoolId,
    actor,
    action,
    entity,
    entityId,
    entityLabel,
    description,
    metadata = {}
}) => {
    try {
        if (!schoolDb || !schoolId || !actor) {
            // console.warn("Activity logging skipped: Missing schoolDb, schoolId or actor info.");
            return;
        }

        const ActivityLog = schoolDb.models.ActivityLog || schoolDb.model('ActivityLog', ActivityLogSchema);

        // Determine name for the actor
        const actorName = actor.firstName && actor.lastName 
            ? `${actor.firstName} ${actor.lastName}` 
            : actor.firstName || actor.name || actor.userId || "System";

        const logId = `LOG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        const newLog = new ActivityLog({
            logId,
            schoolId,
            actorId: actor.userId || actor.teacherId || actor.studentId || actor.parentId || "system",
            actorName,
            actorRole: actor.role || "system",
            action,
            entity,
            entityId,
            entityLabel,
            description,
            metadata
        });

        await newLog.save();
    } catch (error) {
        console.error("Activity Logging Error:", error.message);
    }
};

module.exports = {
    logActivity
};
