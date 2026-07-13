// apps/sm-payment-service/controllers/feePayment.controller.js

const FeePaymentService = require('../services/feePayment.service');
const FeePaymentValidator = require('../validators/feePayment.validator');
const { RecordPaymentDTO, RefundPaymentDTO, FeePaymentResponseDTO } = require('../dto/feePayment.dto');

class FeePaymentController {
    async recordPayment(req, res, next) {
        try {
            const { schoolId } = req.params;
            const validation = FeePaymentValidator.validateRecord(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const recordDto = new RecordPaymentDTO(req.body);
            const actor = req.user;

            const payment = await FeePaymentService.recordPayment(schoolId, recordDto, actor);

            return res.status(201).json({
                success: true,
                message: 'Payment recorded successfully',
                data: new FeePaymentResponseDTO(payment)
            });
        } catch (e) {
            next(e);
        }
    }

    async getPayments(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;
            const pagination = req.pagination;

            const result = await FeePaymentService.getPayments(schoolId, filters, pagination);

            return res.status(200).json({
                success: true,
                data: result.data.map(item => new FeePaymentResponseDTO(item)),
                pagination: result.pagination
            });
        } catch (e) {
            next(e);
        }
    }

    async getPaymentById(req, res, next) {
        try {
            const { schoolId, transactionId } = req.params;

            const payment = await FeePaymentService.getPaymentById(schoolId, transactionId);

            return res.status(200).json({
                success: true,
                data: new FeePaymentResponseDTO(payment)
            });
        } catch (e) {
            next(e);
        }
    }

    async getPaymentsByStudent(req, res, next) {
        try {
            const { schoolId, studentId } = req.params;
            const requester = req.user;

            const payments = await FeePaymentService.getPaymentsByStudent(schoolId, studentId, requester);

            return res.status(200).json({
                success: true,
                data: payments.map(item => new FeePaymentResponseDTO(item))
            });
        } catch (e) {
            next(e);
        }
    }

    async issueRefund(req, res, next) {
        try {
            const { schoolId, paymentId } = req.params;
            const validation = FeePaymentValidator.validateRefund(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const refundDto = new RefundPaymentDTO(req.body);
            const actor = req.user;

            const result = await FeePaymentService.issueRefund(schoolId, paymentId, refundDto, actor);

            return res.status(200).json({
                success: true,
                message: 'Refund issued successfully',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FeePaymentController();
