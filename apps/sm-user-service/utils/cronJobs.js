const cron = require('node-cron');
const { sendLogExpiryWarningEmails } = require('./logExpiryMailer');
const { SchoolModel: School } = require('@sms/shared');

/**
 * Initialize all cron jobs for the user service
 */
const initCronJobs = () => {
    // Run log expiry check daily at 1:00 AM
    cron.schedule('0 1 * * *', async () => {
        console.log('Running daily log expiry check...');
        try {
            // Get all schools to process their logs
            const schools = await School.find({ status: 'active' });
            
            for (const school of schools) {
                try {
                    await sendLogExpiryWarningEmails(school.schoolId);
                } catch (schoolError) {
                    console.error(`Error processing log expiry for school ${school.schoolId}:`, schoolError.message);
                }
            }
            console.log('Log expiry check completed.');
        } catch (error) {
            console.error('Failed to run log expiry cron job:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    console.log('Cron jobs initialized.');
};

module.exports = {
    initCronJobs
};
