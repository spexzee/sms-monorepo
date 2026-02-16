const mongoose = require("mongoose");

const menuBackupSchema = new mongoose.Schema(
    {
        batchId: {
            type: String,
            required: true,
        },
        performedBy: {
            type: String,
            default: "system",
        },
        menuSnapshot: {
            type: Array,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("MenuBackup", menuBackupSchema);
