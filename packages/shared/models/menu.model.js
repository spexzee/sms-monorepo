const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    menuId: {
      type: String,
      required: true,
      unique: true,
    },
    menuName: {
      type: String,
      required: true,
    },
    menuUrl: {
      type: String,
      required: true,
    },
    menuOrder: {
      type: [String],
      required: true,
    },
    menuType: {
      type: String,
      enum: ["main", "sub"],
      required: true,
    },
    parentMenuId: {
      type: String,
      default: null,
    },
    menuAccessRoles: {
      type: [String],
      required: true,
    },
    menuIcon: {
      type: String,
      default: null,
    },
    schoolId: {
      type: [String],
      default: [],
      required: function () {
        return !(
          this.menuAccessRoles && this.menuAccessRoles.includes("super_admin")
        );
      },
    },
    defaultMenu: {
      type: Boolean,
      default: false,
    },
    deactivatedRoles: {
      type: [String],
      default: [],
    },
    deactivatedSchools: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Menu", menuSchema);
