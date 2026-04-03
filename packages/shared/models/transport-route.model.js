// packages/shared/models/transport-route.model.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Embedded student schema for a stop
const TransportStopStudentSchema = new Schema({
    studentId: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    class: { type: String },
    className: { type: String },
    section: { type: String },
    sectionName: { type: String },
    parentId: { type: String },
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },
    profileImage: { type: String },
}, { _id: false });

// Embedded stop schema
const TransportStopSchema = new Schema({
    stopId: { type: String, required: true },
    name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    order: { type: Number, required: true },
    pickupTime: { type: String }, // e.g., "07:15 AM"
    dropTime: { type: String },   // e.g., "03:30 PM"
    students: [TransportStopStudentSchema],
}, { _id: false });

// Driver schema (embedded)
const TransportDriverSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    profileImage: { type: String },
}, { _id: false });

// Main transport route schema
const TransportRouteSchema = new Schema({
    schoolId: { type: String, required: true, index: true },
    routeId: { type: String, required: true, unique: true },
    routeName: { type: String, required: true },
    routeNumber: { type: String },
    color: { type: String, default: '#4285F4' }, // hex color for map display
    driver: TransportDriverSchema, // Embedded for snapshot/legacy
    driverId: { type: String, index: true }, // Reference to New Driver Model
    vehicleId: { type: String, index: true }, // Reference to New Vehicle Model
    busNumber: { type: String }, // Can be derived from Vehicle, but kept for simplicity
    stops: [TransportStopSchema],
    routeCoordinates: { type: [[Number]], default: [] }, // array of [lat, lng]
    currentLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date },
        speed: { type: Number }, // km/h
        heading: { type: Number }, // degrees
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalStudents: { type: Number, default: 0 },
    currentTrip: {
        startTime: { type: Date },
        status: { type: String, enum: ['on-time', 'delayed', 'stopped'], default: 'stopped' },
        lastCheckIn: { type: Date },
    },
}, { timestamps: true });

// Virtual to compute totalStudents from stops
TransportRouteSchema.virtual('computedTotalStudents').get(function () {
    return this.stops.reduce((sum, stop) => sum + (stop.students?.length || 0), 0);
});

// Indexes for fast lookups
TransportRouteSchema.index({ schoolId: 1, routeId: 1 });
TransportRouteSchema.index({ schoolId: 1, status: 1 });
TransportRouteSchema.index({ schoolId: 1, driver: 1 });

module.exports = TransportRouteSchema;
