const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const { paginate } = require('../utils/pagination');

const {
    recordPayment,
    getPayments,
    getPaymentById,
    getPaymentsByStudent,
    issueRefund
} = require('../controllers/feePayment.controller');

// Apply auth globally
router.use(Authenticated);

// Record a payment (Admin only)
router.post(
    '/',
    authorizeRoles('sch_admin'),
    recordPayment
);

// List all payments (Admin only)
router.get(
    '/',
    authorizeRoles('sch_admin'),
    paginate,
    getPayments
);

// Get student's payments (Admin, Student, and Parent allowed)
router.get(
    '/student/:studentId',
    authorizeRoles('sch_admin', 'student', 'parent'),
    getPaymentsByStudent
);

// Get single payment details (Admin, Student, and Parent allowed)
router.get(
    '/:transactionId',
    authorizeRoles('sch_admin', 'student', 'parent'),
    getPaymentById
);

// Process a refund (Admin only)
router.post(
    '/:paymentId/refund',
    authorizeRoles('sch_admin'),
    issueRefund
);

module.exports = router;
