const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    roleCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    prefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    basePath: {
      type: String,
      required: true,
      trim: true,
    },
    colorTheme: {
      type: String,
      enum: ["default", "primary", "secondary", "error", "info", "success", "warning"],
      default: "primary",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Role", roleSchema);
