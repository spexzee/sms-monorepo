// apps/sm-transport-service/utils/cronJobs.js
const cron = require('node-cron');
const { checkExpiries } = require('./expiryChecker');

const initCronJobs = () => {
    // Run daily at 1:00 AM
    cron.schedule('0 1 * * *', () => {
        console.log('⏰ Running daily transport expiry check...');
        checkExpiries();
    });

    console.log('✅ Transport Cron Jobs Initialized');
};

module.exports = { initCronJobs };
