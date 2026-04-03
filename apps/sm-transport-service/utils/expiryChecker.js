// apps/sm-transport-service/utils/expiryChecker.js
const { SchoolModel: School, VehicleSchema, DriverSchema, NotificationSchema } = require('@sms/shared/models');
const { getSchoolDbConnection } = require('../configs/db');
const { sendEmail } = require('@sms/shared/utils');
const { v4: uuidv4 } = require('uuid');

const checkExpiries = async () => {
    try {
        const schools = await School.find({ status: 'active' });
        const now = new Date();
        const thresholds = [15, 7, 2];

        for (const school of schools) {
            const db = getSchoolDbConnection(school.schoolDbName);
            const Vehicle = db.model('Vehicle', VehicleSchema);
            const Driver = db.model('Driver', DriverSchema);
            const Notification = db.model('Notification', NotificationSchema);

            // Check Vehicles
            const vehicles = await Vehicle.find({ status: 'active' });
            for (const v of vehicles) {
                await checkAndNotify(v, 'insuranceExpiry', 'Insurance', school, Notification);
                await checkAndNotify(v, 'registrationExpiry', 'Registration', school, Notification);
            }

            // Check Drivers
            const drivers = await Driver.find({ status: 'active' });
            for (const d of drivers) {
                await checkAndNotify(d, 'licenseExpiry', 'Driving License', school, Notification, true);
            }
        }
    } catch (err) {
        console.error('Expiry Check Error:', err);
    }
};

async function checkAndNotify(doc, field, label, school, Notification, isDriver = false) {
    if (!doc[field]) return;
    const diffDays = Math.ceil((doc[field] - new Date()) / (1000 * 60 * 60 * 24));
    const thresholds = [15, 7, 2];

    if (thresholds.includes(diffDays)) {
        const title = `⚠️ ${label} Expiry Alert: ${doc.name || doc.firstName}`;
        const message = `${label} for ${isDriver ? 'Driver ' + doc.firstName : 'Vehicle ' + doc.plateNumber} is expiring in ${diffDays} days (${doc[field].toLocaleDateString()}). Please renew immediately.`;

        // Notify Admin (we'll need an admin userId for this school)
        // For simplicity, we'll send to a generic school contact email or all school admins
        // In this system, we can create a notification entry for "sch_admin" role
        await Notification.create({
            notificationId: uuidv4(),
            schoolId: school.schoolId,
            userId: 'admin', // Or fetch actual admin IDs
            userRole: 'sch_admin',
            title, message,
            type: 'expiry_alert',
            referenceId: doc.vehicleId || doc.driverId,
            referenceType: isDriver ? 'driver' : 'vehicle'
        });

        if (isDriver && doc.email) {
            await Notification.create({
                notificationId: uuidv4(),
                schoolId: school.schoolId,
                userId: doc.driverId,
                userRole: 'driver',
                title, message,
                type: 'expiry_alert',
                referenceId: doc.driverId,
                referenceType: 'driver'
            });
            await sendEmail({ to: doc.email, subject: title, html: `<p>${message}</p>` });
        }
    }
}

module.exports = { checkExpiries };
