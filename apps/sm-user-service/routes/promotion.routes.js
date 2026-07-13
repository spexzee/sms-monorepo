const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    previewPromotion,
    promoteClass,
    bulkPromote,
    markRepeat,
    graduateBatch,
    archiveYear,
    getPromotionLogs,
    rollbackPromotion,
} = require("../controllers/promotion.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// Promotion routes protected with school administrator authorization
router.get(
    "/preview",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    previewPromotion
);

router.post(
    "/promote-class",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    promoteClass
);

router.post(
    "/bulk",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    bulkPromote
);

router.post(
    "/repeat",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    markRepeat
);

router.post(
    "/graduate",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    graduateBatch
);

router.post(
    "/archive",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    archiveYear
);

router.get(
    "/logs",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    getPromotionLogs
);

router.post(
    "/rollback/:logId",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    rollbackPromotion
);

module.exports = router;
