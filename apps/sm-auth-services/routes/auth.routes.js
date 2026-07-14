const express = require("express");
const router = express.Router();

const { login, verifyToken, createAdmin, requestSuperAdminOtp, confirmSuperAdminOtp } = require("../controllers/auth.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// Public routes (no authentication required)
router.post("/login", login); // Unified login for all user types
router.post("/super-admin/request-otp", requestSuperAdminOtp);
router.post("/super-admin/confirm-otp", confirmSuperAdminOtp);

// Protected routes
router.get("/verify-token", Authenticated, verifyToken);
router.post("/create-admin", Authenticated, authorizeRoles("super_admin"), createAdmin);

module.exports = router;
