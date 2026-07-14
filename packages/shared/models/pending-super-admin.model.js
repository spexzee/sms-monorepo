const mongoose = require("mongoose");

const pendingSuperAdminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300, // TTL index: automatically delete the document after 5 minutes (300 seconds)
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PendingSuperAdmin", pendingSuperAdminSchema);
