// apps/sm-transport-service/controllers/transport.controller.js

const { v4: uuidv4 } = require('uuid');
const { getSchoolDbConnection } = require('../configs/db');
const { TransportRouteSchema } = require('@sms/shared/models');
const { getSchoolDbName } = require('../utils/schoolDbHelper');

// Helper to get TransportRoute model bound to the school DB
const buildRouteQuery = (id) => {
    const isValidId = require('mongoose').isValidObjectId(id);
    return isValidId ? { $or: [{ _id: id }, { routeId: id }] } : { routeId: id };
};
const getModel = async (schoolId) => {
    // Safety check: if schoolId is a path segment, something is wrong
    if (!schoolId || schoolId === 'routes' || schoolId === 'summary') {
        throw new Error(`Invalid schoolId: ${schoolId}`);
    }
    const schoolDbName = await getSchoolDbName(schoolId);
    const db = getSchoolDbConnection(schoolDbName);
    // Always use the schema to ensure we're getting the right model definition for this connection
    try {
        return db.model('TransportRoute');
    } catch {
        return db.model('TransportRoute', TransportRouteSchema);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES — Basic CRUD
// ─────────────────────────────────────────────────────────────────────────────

/** GET /routes — List all routes for a school */
exports.getAllRoutes = async (req, res) => {
    const { schoolId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const routes = await Route.find({}).lean();
        res.json({ success: true, data: routes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/** GET /routes/:routeId — Get single route */
exports.getRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId)).lean();
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/** POST /routes — Create a new route */
exports.createRoute = async (req, res) => {
    const { schoolId } = req.params;
    const payload = req.body;
    try {
        const Route = await getModel(schoolId);

        // Check if driver or vehicle are already assigned
        if (payload.driverId) {
            const assignedDriver = await Route.findOne({ driverId: payload.driverId });
            if (assignedDriver) {
                return res.status(400).json({ success: false, message: `Driver is already assigned to route: ${assignedDriver.routeName}` });
            }
        }
        if (payload.vehicleId) {
            const assignedVehicle = await Route.findOne({ vehicleId: payload.vehicleId });
            if (assignedVehicle) {
                return res.status(400).json({ success: false, message: `Vehicle is already assigned to route: ${assignedVehicle.routeName}` });
            }
        }

        // Compute totalStudents from stops
        const totalStudents = (payload.stops || []).reduce(
            (sum, s) => sum + (s.students?.length || 0), 0
        );
        const newRoute = await Route.create({ ...payload, schoolId, totalStudents });
        res.status(201).json({ success: true, data: newRoute });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

/** PUT /routes/:routeId — Update a route */
exports.updateRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    const updates = req.body;
    try {
        const Route = await getModel(schoolId);
        
        // Find existing route to get its internal _id for exclusion
        const currentRoute = await Route.findOne(buildRouteQuery(routeId));
        if (!currentRoute) return res.status(404).json({ success: false, message: 'Route not found' });

        // Check if driver or vehicle are already assigned to OTHER routes
        if (updates.driverId && updates.driverId !== currentRoute.driverId) {
            const assignedDriver = await Route.findOne({ 
                driverId: updates.driverId, 
                _id: { $ne: currentRoute._id } 
            });
            if (assignedDriver) {
                return res.status(400).json({ success: false, message: `Driver is already assigned to route: ${assignedDriver.routeName}` });
            }
        }
        if (updates.vehicleId && updates.vehicleId !== currentRoute.vehicleId) {
            const assignedVehicle = await Route.findOne({ 
                vehicleId: updates.vehicleId, 
                _id: { $ne: currentRoute._id } 
            });
            if (assignedVehicle) {
                return res.status(400).json({ success: false, message: `Vehicle is already assigned to route: ${assignedVehicle.routeName}` });
            }
        }

        // Recompute totalStudents if stops changed
        if (updates.stops) {
            updates.totalStudents = updates.stops.reduce(
                (sum, s) => sum + (s.students?.length || 0), 0
            );
        }
        const updated = await Route.findOneAndUpdate({ _id: currentRoute._id }, updates, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

/** DELETE /routes/:routeId — Delete a route */
exports.deleteRoute = async (req, res) => {
    const { schoolId, routeId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const result = await Route.findOneAndDelete(buildRouteQuery(routeId));
        if (!result) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STOPS — Add / Update / Delete stops on a route
// ─────────────────────────────────────────────────────────────────────────────

/** POST /routes/:routeId/stops — Add a stop */
exports.addStop = async (req, res) => {
    const { schoolId, routeId } = req.params;
    const stopData = req.body;
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId));
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        const stop = {
            stopId: stopData.stopId || uuidv4(),
            name: stopData.name,
            latitude: stopData.latitude,
            longitude: stopData.longitude,
            order: stopData.order ?? route.stops.length,
            pickupTime: stopData.pickupTime,
            dropTime: stopData.dropTime,
            students: stopData.students || [],
        };

        route.stops.push(stop);
        route.totalStudents = route.stops.reduce((s, st) => s + (st.students?.length || 0), 0);
        await route.save();

        res.status(201).json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

/** PUT /routes/:routeId/stops/:stopId — Update a stop */
exports.updateStop = async (req, res) => {
    const { schoolId, routeId, stopId } = req.params;
    const updates = req.body;
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId));
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        const stopIdx = route.stops.findIndex(s => s.stopId === stopId);
        if (stopIdx === -1) return res.status(404).json({ success: false, message: 'Stop not found' });

        Object.assign(route.stops[stopIdx], updates);
        route.totalStudents = route.stops.reduce((s, st) => s + (st.students?.length || 0), 0);
        await route.save();

        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

/** DELETE /routes/:routeId/stops/:stopId — Remove a stop */
exports.removeStop = async (req, res) => {
    const { schoolId, routeId, stopId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId));
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        const before = route.stops.length;
        route.stops = route.stops.filter(s => s.stopId !== stopId);
        if (route.stops.length === before) {
            return res.status(404).json({ success: false, message: 'Stop not found' });
        }
        // Re-index order
        route.stops.forEach((s, i) => { s.order = i; });
        route.totalStudents = route.stops.reduce((s, st) => s + (st.students?.length || 0), 0);
        await route.save();

        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER — Assign / update driver on a route
// ─────────────────────────────────────────────────────────────────────────────

/** PUT /routes/:routeId/driver — Assign / update driver */
exports.updateDriver = async (req, res) => {
    const { schoolId, routeId } = req.params;
    const driverData = req.body; // { name, phone, licenseNumber, profileImage }
    try {
        const Route = await getModel(schoolId);
        const updated = await Route.findOneAndUpdate(
            buildRouteQuery(routeId),
            { driver: driverData },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, data: updated });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS — Assign / remove students from a stop
// ─────────────────────────────────────────────────────────────────────────────

/** POST /routes/:routeId/stops/:stopId/students — Assign students to a stop */
exports.assignStudents = async (req, res) => {
    const { schoolId, routeId, stopId } = req.params;
    const { students } = req.body; // Array of TransportStopStudent
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId));
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        const stopIdx = route.stops.findIndex(s => s.stopId === stopId);
        if (stopIdx === -1) return res.status(404).json({ success: false, message: 'Stop not found' });

        // Merge — avoid duplicate studentIds
        const existingIds = new Set(route.stops[stopIdx].students.map(s => s.studentId));
        const newStudents = (students || []).filter(s => !existingIds.has(s.studentId));
        route.stops[stopIdx].students.push(...newStudents);
        route.totalStudents = route.stops.reduce((s, st) => s + (st.students?.length || 0), 0);
        await route.save();

        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: err.message });
    }
};

/** DELETE /routes/:routeId/stops/:stopId/students/:studentId — Remove a student from a stop */
exports.removeStudent = async (req, res) => {
    const { schoolId, routeId, stopId, studentId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const route = await Route.findOne(buildRouteQuery(routeId));
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        const stopIdx = route.stops.findIndex(s => s.stopId === stopId);
        if (stopIdx === -1) return res.status(404).json({ success: false, message: 'Stop not found' });

        route.stops[stopIdx].students = route.stops[stopIdx].students.filter(
            s => s.studentId !== studentId
        );
        route.totalStudents = route.stops.reduce((s, st) => s + (st.students?.length || 0), 0);
        await route.save();

        res.json({ success: true, data: route });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROUTE LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

/** GET /student/:studentId/route — Get the route & stop assigned to a student */
exports.getStudentRoute = async (req, res) => {
    const { schoolId, studentId } = req.params;
    try {
        const Route = await getModel(schoolId);
        // Find route where any stop contains this studentId
        const route = await Route.findOne({
            'stops.students.studentId': studentId,
        }).lean();

        if (!route) {
            return res.status(404).json({ success: false, message: 'No route assigned to this student' });
        }

        // Find the specific stop
        const stop = route.stops.find(s => s.students?.some(st => st.studentId === studentId));
        res.json({ success: true, data: { route, stop } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY STATISTICS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /summary — Transport summary statistics for a school */
exports.getSummary = async (req, res) => {
    const { schoolId } = req.params;
    try {
        const Route = await getModel(schoolId);
        const routes = await Route.find({}).lean();

        const totalRoutes = routes.length;
        const activeRoutes = routes.filter(r => r.status === 'active').length;
        const inactiveRoutes = totalRoutes - activeRoutes;
        const totalStops = routes.reduce((sum, r) => sum + (r.stops?.length || 0), 0);
        const totalStudents = routes.reduce((sum, r) => sum + (r.totalStudents || 0), 0);

        // Unique drivers (by name)
        const driverNames = new Set(routes.map(r => r.driver?.name).filter(Boolean));

        res.json({
            success: true,
            data: {
                totalRoutes,
                activeRoutes,
                inactiveRoutes,
                totalStops,
                totalStudents,
                totalDrivers: driverNames.size,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
