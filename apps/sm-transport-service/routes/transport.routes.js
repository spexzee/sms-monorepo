// apps/sm-transport-service/routes/transport.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const transportController = require('../controllers/transport.controller');
const notificationController = require('../controllers/transport-notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Base path: /api/transport/school/:schoolId
// ─────────────────────────────────────────────────────────────────────────────

// ── Collection Endpoints (Literal Matches) ────────────────────────────────────
router.get('/summary', transportController.getSummary);
router.get('/routes', transportController.getAllRoutes);
router.get('/notifications', notificationController.getNotificationHistory);

// ── Specific Route Operations (Parameterized) ─────────────────────────────────
router.post('/routes', transportController.createRoute);
router.get('/routes/:routeId', transportController.getRoute);
router.put('/routes/:routeId', transportController.updateRoute);
router.patch('/routes/:routeId/status', transportController.updateTripStatus);
router.delete('/routes/:routeId', transportController.deleteRoute);

// ── Stops ─────────────────────────────────────────────────────────────────────
router.post('/routes/:routeId/stops', transportController.addStop);
router.put('/routes/:routeId/stops/:stopId', transportController.updateStop);
router.delete('/routes/:routeId/stops/:stopId', transportController.removeStop);

// ── Driver ────────────────────────────────────────────────────────────────────
router.put('/routes/:routeId/driver', transportController.updateDriver);

// ── Student assignment ────────────────────────────────────────────────────────
router.post('/routes/:routeId/stops/:stopId/students', transportController.assignStudents);
router.delete('/routes/:routeId/stops/:stopId/students/:studentId', transportController.removeStudent);

// ── Student route lookup ──────────────────────────────────────────────────────
router.get('/student/:studentId/route', transportController.getStudentRoute);

// ── Notifications ─────────────────────────────────────────────────────────────
router.post('/notifications/send', notificationController.sendNotification);
router.post('/notifications/bus-status', notificationController.updateBusStatus);

module.exports = router;
