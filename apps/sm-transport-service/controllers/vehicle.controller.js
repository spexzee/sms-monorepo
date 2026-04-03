// apps/sm-transport-service/controllers/vehicle.controller.js
const { getSchoolDbConnection } = require('../configs/db');
const { VehicleSchema } = require('@sms/shared/models');
const { v4: uuidv4 } = require('uuid');
const { getSchoolDbName } = require('../utils/schoolDbHelper');

const getModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const db = getSchoolDbConnection(schoolDbName);
    try {
        return db.model('Vehicle');
    } catch {
        return db.model('Vehicle', VehicleSchema);
    }
};

exports.createVehicle = async (req, res) => {
    const { schoolId } = req.params;
    const payload = req.body;
    try {
        const Vehicle = await getModel(schoolId);
        const vehicleId = payload.vehicleId || `VHC-${uuidv4().slice(0, 8).toUpperCase()}`;
        const newVehicle = await Vehicle.create({ ...payload, vehicleId, schoolId });
        res.status(201).json({ success: true, data: newVehicle });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getAllVehicles = async (req, res) => {
    const { schoolId } = req.params;
    try {
        const Vehicle = await getModel(schoolId);
        const vehicles = await Vehicle.find({}).lean();
        res.json({ success: true, data: vehicles });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateVehicle = async (req, res) => {
    const { schoolId, id: vehicleId } = req.params;
    const updates = req.body;
    try {
        const Vehicle = await getModel(schoolId);
        const updated = await Vehicle.findOneAndUpdate({ vehicleId }, updates, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    const { schoolId, id: vehicleId } = req.params;
    try {
        const Vehicle = await getModel(schoolId);
        const result = await Vehicle.findOneAndDelete({ vehicleId });
        if (!result) return res.status(404).json({ success: false, message: 'Vehicle not found' });
        res.json({ success: true, message: 'Vehicle deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
