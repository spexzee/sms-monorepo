const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");

// Role management routes
router.get("/", roleController.getAllRoles);
router.get("/:roleCode", roleController.getRoleByCode);
router.post("/", roleController.createRole);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
