// apps/sm-transport-service/controllers/transport.controller.js

const { getSchoolDbConnection } = require('../configs/db');
const TransportRoute = require('@sms/shared/models').TransportRouteSchema;

// Helper to get model bound to school DB
const getModel = (schoolId) => {
    const db = getSchoolDbConnection(`school-db-${schoolId}`);
    return db.model('TransportRoute', TransportRoute);
};

// Get all routes for a school
exports.getAllRoutes = async (req, res) => {
    const { schoolId } = req.params;
    try {
        const Route = getModel(schoolId);
        const routes = await Route.find({});
        res.json({ success: true, data: routes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get a single route by routeId
exports.getRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    try {
        const Route = getModel(schoolId);
        const route = await Route.findById(routeId);
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Create a new route
exports.createRoute = async (req, res) => {
    const { schoolId } = req.params;
    const payload = req.body;
    try {
        const Route = getModel(schoolId);
        const newRoute = await Route.create({ ...payload, schoolId });
        res.status(201).json({ success: true, data: newRoute });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Update an existing route
exports.updateRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    const updates = req.body;
    try {
        const Route = getModel(schoolId);
        const updated = await Route.findByIdAndUpdate(routeId, updates, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Route not found' });
        
        // Trigger notification if status changed to active (e.g. "Bus is on its way")
        if (updates.status === 'active') {
            console.log(`Triggering transport notification for route: ${updated.routeName}`);
            // Logic to call notification service will go here
        }

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    try {
        const Route = getModel(schoolId);
        const result = await Route.findByIdAndDelete(routeId);
        if (!result) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, message: 'Route deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
