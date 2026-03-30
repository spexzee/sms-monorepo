const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { ActivityLogSchema, SchoolModel: School, AdminModel: Admin } = require("@sms/shared");
const { sendEmail } = require("@sms/shared/utils/emailService");

/**
 * Get ActivityLog model for a specific school
 */
const getActivityLogModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.models.ActivityLog || schoolDb.model('ActivityLog', ActivityLogSchema);
};

/**
 * Check for logs expiring in Exactly 7 days and send warning emails to school admins.
 * This runs periodically (e.g. daily via a cron job).
 */
const sendLogExpiryWarningEmails = async () => {
    try {
        // 1. Get all schools
        const schools = await School.find({ status: 'active' });

        for (const school of schools) {
            const schoolId = school.schoolId;
            const schoolDbName = await getSchoolDbName(schoolId);
            if (!schoolDbName) continue;

            const ActivityLog = getActivityLogModel(schoolDbName);

            // 2. Count logs created 83 days ago (will expire in 7 days of a 90-day TTL)
            // Note: Since TTL is 90 days, 83 days old logs have 7 days left.
            const warningThresholdDateStart = new Date();
            warningThresholdDateStart.setDate(warningThresholdDateStart.getDate() - 83);
            warningThresholdDateStart.setHours(0, 0, 0, 0);

            const warningThresholdDateEnd = new Date(warningThresholdDateStart);
            warningThresholdDateEnd.setHours(23, 59, 59, 999);

            const count = await ActivityLog.countDocuments({
                createdAt: { $gte: warningThresholdDateStart, $lte: warningThresholdDateEnd }
            });

            if (count > 0) {
                // 3. Get school admin email
                // Note: Normally we'd find the user with role 'sch_admin' for this school
                const admin = await Admin.findOne({ schoolId, role: 'sch_admin' });
                
                if (admin && admin.email) {
                    await sendEmail({
                        to: admin.email,
                        subject: `Action Required: Activity Logs Expiring in 7 Days - ${school.schoolName}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                                <h1 style="color: #5C6BC0;">Log Expiry Notification</h1>
                                <p>Dear ${admin.firstName || 'Administrator'},</p>
                                <p>This is to inform you that <strong>${count}</strong> activity logs in your school system (<strong>${school.schoolName}</strong>) are scheduled to expire and be permanently deleted in <strong>7 days</strong>.</p>
                                <p>To maintain your records, please visit the <strong>Activity Logs</strong> section in the School Admin dashboard to download or archive these logs if needed.</p>
                                <div style="margin-top: 30px; font-size: 0.9em; color: #777;">
                                    <p>Settings: Auto-expiry is currently set to 90 days.</p>
                                    <p>Thank you for using our School Management System.</p>
                                </div>
                            </div>
                        `
                    });
                    console.log(`[LogExpiryMailer] Warning sent to ${admin.email} for ${count} logs.`);
                }
            }
        }
    } catch (error) {
        console.error("Log Expiry Mailer Error:", error.message);
    }
};

module.exports = {
    sendLogExpiryWarningEmails
};
