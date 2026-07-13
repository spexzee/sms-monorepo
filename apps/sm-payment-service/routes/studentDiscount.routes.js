const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

const {
    applyDiscount,
    removeDiscount,
    getStudentDiscounts
} = require('../controllers/studentDiscount.controller');

// Apply auth globally
router.use(Authenticated);

// Apply discount to student (Admin only)
router.post(
    '/apply',
    authorizeRoles('sch_admin'),
    applyDiscount
);

// Remove discount (Admin only)
router.delete(
    '/apply/:studentDiscountId',
    authorizeRoles('sch_admin'),
    removeDiscount
);

// View applied discounts (Admin, Student, Parent)
router.get(
    '/student/:studentId',
    authorizeRoles('sch_admin', 'student', 'parent'),
    getStudentDiscounts
);

module.exports = router;
