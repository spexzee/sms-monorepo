const mongoose = require("mongoose");

// School model - merged from all services with complete fields
// This is used as a reference to the schools collection in SuperAdmin database
const schoolSchema = new mongoose.Schema(
    {
        schoolId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolName: {
            type: String,
            required: true,
        },
        schoolLogo: {
            type: String,
        },
        schoolDbName: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        schoolAddress: {
            type: String,
        },
        schoolEmail: {
            type: String,
        },
        schoolContact: {
            type: String,
        },
        schoolWebsite: {
            type: String,
        },
        schoolTagline: {
            type: String,
        },
        // Subdomain for school-specific login page branding
        // e.g. "greenvalley" → greenvalley.spexzee.me
        subdomain: {
            type: String,
            unique: true,
            sparse: true, // allows multiple schools to have null subdomain
            lowercase: true,
            trim: true,
        },
        // Per-school login page theme configuration
        loginTheme: {
            primaryColor:    { type: String }, // hex e.g. "#6366F1"
            backgroundColor: { type: String }, // left panel bg
            textColor:       { type: String }, // heading text color
            accentColor:     { type: String }, // gradient accent
            fontFamily:      { type: String }, // e.g. "Inter"
            // When set, this HTML string replaces the ENTIRE login page
            // (both left and right panels). Only used for advanced custom branding.
            customLoginHtml: { type: String },
        },
        location: {
            latitude: {
                type: Number,
            },
            longitude: {
                type: Number,
            },
            radiusMeters: {
                type: Number,
                default: 100,
            },
        },
        // Attendance Settings - determines which attendance mode the school uses
        // Added from sm-platform-service
        attendanceSettings: {
            mode: {
                type: String,
                enum: ["simple", "period_wise", "check_in_out"],
                default: "simple",
            },
            workingHours: {
                start: { type: String, default: "08:00" },
                end: { type: String, default: "16:00" },
            },
            lateThresholdMinutes: {
                type: Number,
                default: 15, // Minutes after start considered late
            },
            halfDayThresholdMinutes: {
                type: Number,
                default: 240, // 4 hours = half day
            },
            periodsPerDay: {
                type: Number,
                default: 8, // For period-wise mode
            },
        },
        currentAcademicYear: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("School", schoolSchema);
