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
  getMenuBackups,
  restoreMenuBackup,
} = require("../controllers/dashboard.controller");

// GET /api/admin/dashboard/stats
router.get("/stats", getDashboardStats);
router.get("/menus/all", getAllMenus);
router.get("/menus/export", getAllMenusForExport);
router.get("/menus/backups", getMenuBackups);
router.post("/menus/bulk-update", bulkUpdateMenus);
router.post("/menus/restore", restoreMenuBackup);
router.get("/menus/:role", getMenus);
router.post("/menus", createMenu);
router.put("/menus/:menuId", updateMenu);
router.delete("/menus/:menuId", deleteMenu);

module.exports = router;
