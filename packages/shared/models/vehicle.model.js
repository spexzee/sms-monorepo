// packages/shared/models/vehicle.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const VehicleSchema = new Schema({
    schoolId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // e.g., "Bus 01"
    model: { type: String },
    make: { type: String },
    year: { type: Number },
    plateNumber: { type: String, required: true },
    capacity: { type: Number, default: 40 },
    fuelType: { type: String, enum: ['diesel', 'petrol', 'electric', 'cng'], default: 'diesel' },
    
    // Expiry dates for alerts
    insuranceExpiry: { type: Date },
    registrationExpiry: { type: Date },
    pollutionExpiry: { type: Date },
    permitExpiry: { type: Date },
    
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
    notes: { type: String },
    
    // Tracking current assignment
    currentDriverId: { type: String },
    currentRouteId: { type: String },
}, { timestamps: true });

VehicleSchema.index({ schoolId: 1, vehicleId: 1 });
VehicleSchema.index({ schoolId: 1, plateNumber: 1 });

module.exports = VehicleSchema;
