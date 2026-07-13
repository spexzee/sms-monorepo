// apps/sm-payment-service/controllers/feeAdjustment.controller.js

const StudentFeeAccountRepository = require('../repositories/studentFeeAccount.repository');
const FeePaymentRepository = require('../repositories/feePayment.repository');
const { createTransaction } = require('../utils/transactionHelper');

class FeeAdjustmentController {
    /**
     * Record Manual Adjustment / Additional Charge / Waiver
     * POST /api/school/:schoolId/fees/adjustments
     */
    async createAdjustment(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { studentId, feeCategoryId, adjustmentType, amount, notes } = req.body;

            if (!studentId || !feeCategoryId || !adjustmentType || amount === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "studentId, feeCategoryId, adjustmentType, and amount are required"
                });
            }

            const adjAmount = Number(amount);
            if (isNaN(adjAmount) || adjAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "amount must be a positive number"
                });
            }

            let account = null;
            if (!account) {
                const StudentFeeAssignmentModel = await StudentFeeAccountRepository.getModel(schoolId);
                account = await StudentFeeAssignmentModel.findOne({ schoolId, studentId, isDeleted: false }).sort({ academicYear: -1 });
            }
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: "No active fee assignment ledger found for this student"
                });
            }

            // 2. Find target line item in fee breakdown
            const lineItem = account.feeBreakdown.find(item => item.feeCategoryId === feeCategoryId);
            if (!lineItem) {
                return res.status(404).json({
                    success: false,
                    message: "Selected fee category line item not found in student's assignment structure"
                });
            }

            // 3. Map frontend types to transaction helper type enum:
            // adjustmentType can be:
            // - 'charge' or 'adjustment_debit' -> adjustment_debit
            // - 'discount' or 'adjustment_credit' -> adjustment_credit
            // - 'waiver' -> waiver
            let transactionType;
            if (adjustmentType === 'charge' || adjustmentType === 'adjustment_debit') {
                transactionType = 'adjustment_debit';
            } else if (adjustmentType === 'discount' || adjustmentType === 'adjustment_credit') {
                transactionType = 'adjustment_credit';
            } else if (adjustmentType === 'waiver') {
                transactionType = 'waiver';
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Invalid adjustmentType: '${adjustmentType}'. Allowed: charge, discount, waiver.`
                });
            }

            // 4. Validate limit for credits/waivers
            if (transactionType === 'waiver' || transactionType === 'adjustment_credit') {
                // netAmountBefore = originalAmount + adjustments - discountAmount - waivedAmount
                const baseAmt = (lineItem.originalAmount || 0) + (lineItem.adjustments || 0) - (lineItem.discountAmount || 0) - (lineItem.waivedAmount || 0);
                if (adjAmount > baseAmt) {
                    return res.status(400).json({
                        success: false,
                        message: `Waiver/Adjustment amount (₹${adjAmount}) cannot exceed the net remaining line item balance (₹${baseAmt})`
                    });
                }
            }

            // 5. Apply update via transaction helper
            const TransactionModel = await FeePaymentRepository.getModel(schoolId);
            const affectedItems = [{
                feeCategoryId,
                categoryName: lineItem.categoryName,
                amount: adjAmount
            }];

            const transaction = await createTransaction({
                account,
                TransactionModel,
                type: transactionType,
                amount: adjAmount,
                description: notes || `Manual adjustment: ${adjustmentType}`,
                reason: notes,
                affectedItems,
                performedBy: req.user?.userId || 'system',
                performedByName: req.user?.name || 'Admin',
                performedByRole: req.user?.role || 'sch_admin'
            });

            return res.status(201).json({
                success: true,
                message: "Fee adjustment recorded successfully",
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List all adjustments and waivers for a school
     * GET /api/school/:schoolId/fees/adjustments
     */
    async getAdjustments(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { studentId } = req.query;
            const TransactionModel = await FeePaymentRepository.getModel(schoolId);

            const query = {
                schoolId,
                type: { $in: ['waiver', 'adjustment_debit', 'adjustment_credit'] },
                isDeleted: false
            };
            if (studentId) {
                query.studentId = studentId;
            }

            const { page = 1, limit = 10, skip = 0 } = req.pagination || {};

            const totalRecords = await TransactionModel.countDocuments(query);
            const data = await TransactionModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return res.status(200).json({
                success: true,
                pagination: {
                    total: totalRecords,
                    page,
                    limit
                },
                data
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Apply Waiver (convenience endpoint, delegates to createAdjustment)
     * POST /api/school/:schoolId/fees/adjustments/waiver
     */
    async applyWaiver(req, res, next) {
        req.body.adjustmentType = 'waiver';
        return this.createAdjustment(req, res, next);
    }
}

module.exports = new FeeAdjustmentController();
