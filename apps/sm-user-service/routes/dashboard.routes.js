const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  getSchoolDashboardStats,
  getMenus,
  getTeacherDashboardStats,
} = require("../controllers/dashboard.controller");
const { checkAuth, checkRole } = require("@sms/shared/middlewares");

// GET /api/school/:schoolId/dashboard/stats
router.get("/stats", getSchoolDashboardStats);
router.get("/menus/:role", getMenus);

// GET /api/school/:schoolId/dashboard/teacher-stats
router.get("/teacher-stats", checkAuth, checkRole(["teacher"]), getTeacherDashboardStats);

module.exports = router;
