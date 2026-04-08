// apps/sm-transport-service/controllers/transport-notification.controller.js

const { v4: uuidv4 } = require('uuid');
const { getSchoolDbConnection } = require('../configs/db');
const { NotificationSchema, TransportRouteSchema } = require('@sms/shared/models');
const { sendEmail: sendEmailUtil } = require('@sms/shared/utils');
const { getSchoolDbName } = require('../utils/schoolDbHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getNotificationModel = async (schoolId) => {
    if (!schoolId || schoolId === 'routes' || schoolId === 'notifications') {
        throw new Error(`Invalid schoolId: ${schoolId}`);
    }
    const schoolDbName = await getSchoolDbName(schoolId);
    const db = getSchoolDbConnection(schoolDbName);
    try {
        return db.model('Notification');
    } catch {
        return db.model('Notification', NotificationSchema);
    }
};

const getRouteModel = async (schoolId) => {
    if (!schoolId || schoolId === 'routes' || schoolId === 'notifications') {
        throw new Error(`Invalid schoolId: ${schoolId}`);
    }
    const schoolDbName = await getSchoolDbName(schoolId);
    const db = getSchoolDbConnection(schoolDbName);
    try {
        return db.model('TransportRoute');
    } catch {
        return db.model('TransportRoute', TransportRouteSchema);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORT NOTIFICATION TYPES
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFICATION_TEMPLATES = {
    bus_departed: {
        title: '🚌 Bus Departed',
        message: (routeName, busNumber) =>
            `Bus ${busNumber || routeName} has departed from school and is on its way.`,
    },
    bus_reached_school: {
        title: '🏫 Bus Reached School',
        message: (routeName, busNumber) =>
            `Bus ${busNumber || routeName} has safely arrived at school.`,
    },
    bus_delayed: {
        title: '⚠️ Bus Delayed',
        message: (routeName, busNumber, extra) =>
            `Bus ${busNumber || routeName} is running late. ${extra || 'Please wait a few extra minutes.'}`,
    },
    child_picked: {
        title: '✅ Child Picked Up',
        message: (_routeName, _bus, _extra, stopName) =>
            `Your child has been picked up at ${stopName || 'the stop'}. Bus is en route to school.`,
    },
    child_dropped: {
        title: '🏠 Child Dropped',
        message: (_routeName, _bus, _extra, stopName) =>
            `Your child has been safely dropped off at ${stopName || 'the stop'}.`,
    },
    transport_update: {
        title: '🚌 Transport Update',
        message: (_routeName, _busNumber, extra) => extra || 'There is a transport update for your route.',
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /notifications/send — Send a transport notification
// Body: { routeId, type, stopId?, customMessage?, sendEmail? }
// ─────────────────────────────────────────────────────────────────────────────
exports.sendNotification = async (req, res) => {
    const { schoolId } = req.params;
    const { routeId, type, stopId, customMessage, sendEmail = false } = req.body;

    if (!routeId || !type) {
        return res.status(400).json({ success: false, message: 'routeId and type are required' });
    }

    if (!NOTIFICATION_TEMPLATES[type]) {
        return res.status(400).json({ success: false, message: `Unknown notification type: ${type}` });
    }

    try {
        const Route = await getRouteModel(schoolId);
        const Notification = await getNotificationModel(schoolId);

        const isValidId = require('mongoose').isValidObjectId(routeId);
        const routeQuery = isValidId ? { $or: [{ _id: routeId }, { routeId }] } : { routeId };
        const route = await Route.findOne(routeQuery).lean();
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        // Determine target stops
        const targetStops = stopId
            ? route.stops.filter(s => s.stopId === stopId)
            : route.stops;

        const template = NOTIFICATION_TEMPLATES[type];
        const notificationsCreated = [];
        const emailPromises = [];

        for (const stop of targetStops) {
            for (const student of stop.students || []) {
                if (!student.parentId) continue;

                const title = template.title;
                const message = customMessage || template.message(
                    route.routeName,
                    route.busNumber,
                    customMessage,
                    stop.name
                );

                // Save in-app notification
                const notification = await Notification.create({
                    notificationId: uuidv4(),
                    schoolId,
                    userId: student.parentId,
                    userRole: 'parent',
                    type,
                    title,
                    message,
                    referenceId: route._id?.toString(),
                    referenceType: 'transport',
                    isRead: false,
                    metadata: {
                        routeId: route._id,
                        routeName: route.routeName,
                        busNumber: route.busNumber,
                        stopName: stop.name,
                        studentId: student.studentId,
                        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                    },
                });
                notificationsCreated.push(notification);

                // Queue email if requested and parent email available
                if (sendEmail && student.parentEmail) {
                    const emailPromise = sendEmailUtil({
                        to: student.parentEmail,
                        subject: title,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                                <h2 style="color: #4285F4;">${title}</h2>
                                <p>${message}</p>
                                <hr style="border: 0; border-top: 1px solid #eee;" />
                                <p style="font-size: 12px; color: #888;">This is an automated transport notification from your school.</p>
                            </div>
                        `,
                    }).catch(err => console.error(`Failed to send email to ${student.parentEmail}:`, err));
                    emailPromises.push(emailPromise);
                }
            }
        }

        // Send queued emails
        if (emailPromises.length > 0) {
            await Promise.allSettled(emailPromises);
        }

        res.json({
            success: true,
            message: `Sent ${notificationsCreated.length} notification(s)`,
            data: { count: notificationsCreated.length },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /notifications/bus-status — Bus status broadcast (departed / arrived)
// Body: { routeId, status: 'departed'|'arrived'|'delayed', customMessage? }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBusStatus = async (req, res) => {
    const { schoolId } = req.params;
    const { routeId, status, customMessage } = req.body;

    const statusToType = {
        departed: 'bus_departed',
        arrived: 'bus_reached_school',
        delayed: 'bus_delayed',
    };

    const notifType = statusToType[status];
    if (!notifType) {
        return res.status(400).json({ success: false, message: 'Invalid status. Use: departed, arrived, delayed' });
    }

    // Delegate to sendNotification with the mapped type
    req.body.type = notifType;
    return exports.sendNotification(req, res);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /notifications — Get transport notification history for a school
// Query: ?limit=50&skip=0&type=bus_departed
// ─────────────────────────────────────────────────────────────────────────────
exports.getNotificationHistory = async (req, res) => {
    const { schoolId } = req.params;
    const { limit = 50, skip = 0, type } = req.query;

    try {
        const Notification = await getNotificationModel(schoolId);

        const filter = {
            schoolId,
            referenceType: 'transport',
        };
        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        const total = await Notification.countDocuments(filter);

        res.json({ success: true, data: notifications, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
