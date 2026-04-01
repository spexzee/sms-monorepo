// apps/sm-transport-service/routes/transport.routes.js

const express = require('express');
const router = express.Router({ mergeParams: true });

const transportController = require('../controllers/transport.controller');

// Base path: /api/transport/school/:schoolId
// List all routes for a school
router.get('/', transportController.getAllRoutes);

// Get a specific route
router.get('/:routeId', transportController.getRoute);

// Create a new route
router.post('/', transportController.createRoute);

// Update a route
router.put('/:routeId', transportController.updateRoute);

// Delete a route
router.delete('/:routeId', transportController.deleteRoute);

module.exports = router;
