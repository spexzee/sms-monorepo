const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

const {
    createDiscount,
    getDiscounts,
    updateDiscount,
    deleteDiscount
} = require('../controllers/feeDiscount.controller');

// Apply auth globally
router.use(Authenticated);
router.use(authorizeRoles('sch_admin'));

// Create Template
router.post('/', createDiscount);

// List Templates
router.get('/', getDiscounts);

// Update Template
router.put('/:discountId', updateDiscount);

// Delete Template
router.delete('/:discountId', deleteDiscount);

module.exports = router;
