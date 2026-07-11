// apps/sm-payment-service/controllers/feeReceipt.controller.js

const FeeReceiptService = require('../services/feeReceipt.service');
const { FeeReceiptResponseDTO } = require('../dto/feeReceipt.dto');

class FeeReceiptController {
    async getReceiptById(req, res, next) {
        try {
            const { schoolId, receiptId } = req.params;
            const requester = req.user;

            const receipt = await FeeReceiptService.getReceiptById(schoolId, receiptId, requester);

            return res.status(200).json({
                success: true,
                data: new FeeReceiptResponseDTO(receipt)
            });
        } catch (e) {
            next(e);
        }
    }

    async downloadReceiptPdf(req, res, next) {
        try {
            const { schoolId, receiptId } = req.params;
            const requester = req.user;

            // Set content type and disposition headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptId}.pdf`);

            // Pipes PDF stream directly to Express response res
            await FeeReceiptService.getReceiptPDFStream(schoolId, receiptId, requester, res);
        } catch (e) {
            next(e);
        }
    }

    async getStudentReceipts(req, res, next) {
        try {
            const { schoolId, studentId } = req.params;
            const requester = req.user;

            const receipts = await FeeReceiptService.getStudentReceipts(schoolId, studentId, requester);

            return res.status(200).json({
                success: true,
                data: receipts.map(item => new FeeReceiptResponseDTO(item))
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FeeReceiptController();
