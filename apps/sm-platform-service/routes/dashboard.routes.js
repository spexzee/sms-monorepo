const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getAllMenus,
  getAllMenusForExport,
  bulkUpdateMenus,
} = require("../controllers/dashboard.controller");

// GET /api/admin/dashboard/stats
router.get("/stats", getDashboardStats);
router.get("/menus/all", getAllMenus);
router.get("/menus/export", getAllMenusForExport);
router.post("/menus/bulk-update", bulkUpdateMenus);
router.get("/menus/:role", getMenus);
router.post("/menus", createMenu);
router.put("/menus/:menuId", updateMenu);
router.delete("/menus/:menuId", deleteMenu);

module.exports = router;
