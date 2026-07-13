const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

const {
    getReceiptById,
    downloadReceiptPdf,
    getStudentReceipts
} = require('../controllers/feeReceipt.controller');

// Apply auth globally
router.use(Authenticated);

// Get Student receipts list (Admin, Student, Parent)
router.get(
    '/student/:studentId',
    authorizeRoles('sch_admin', 'student', 'parent'),
    getStudentReceipts
);

// Get receipt JSON details (Admin, Student, Parent)
router.get(
    '/:receiptId',
    authorizeRoles('sch_admin', 'student', 'parent'),
    getReceiptById
);

// Download receipt PDF (Admin, Student, Parent)
router.get(
    '/:receiptId/pdf',
    authorizeRoles('sch_admin', 'student', 'parent'),
    downloadReceiptPdf
);

module.exports = router;
