const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    createAdjustment,
    getAdjustments,
    applyWaiver
} = require('../controllers/feeAdjustment.controller');

// Apply auth globally
router.use(Authenticated);
router.use(authorizeRoles('sch_admin'));

// Create Adjustment
router.post('/', createAdjustment);

// List Adjustments
router.get('/', paginate, getAdjustments);

// Apply Waiver
router.post('/waiver', applyWaiver);

module.exports = router;
