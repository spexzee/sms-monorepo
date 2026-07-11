// apps/sm-payment-service/services/feeReceipt.service.js

const FeeReceiptRepository = require('../repositories/feeReceipt.repository');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { StudentSchema } = require("@sms/shared/models");
const { generateReceiptPDF } = require('../utils/pdfGenerator');

/**
 * FeeReceipt Service
 * Orchestrates lookup parameters matching, security boundaries validation, 
 * and pipes PDFKit rendering streams directly to network outputs.
 */
class FeeReceiptService {
    /**
     * Resolves student model dynamically
     */
    async _getStudentModel(schoolId) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            return schoolDb.model("Student");
        } catch (e) {
            return schoolDb.model("Student", StudentSchema);
        }
    }

    /**
     * Asserts query requester belongs to the matching student ID boundary
     */
    async _assertRequesterAccess(schoolId, studentId, requester) {
        if (!requester) return;

        if (requester.role === 'student' && requester.studentId !== studentId) {
            const error = new Error('Unauthorized access to receipt details');
            error.statusCode = 403;
            throw error;
        }

        if (requester.role === 'parent') {
            const StudentModel = await this._getStudentModel(schoolId);
            const targetStudent = await StudentModel.findOne({ schoolId, studentId }).lean();
            if (!targetStudent || targetStudent.parentId !== requester.parentId) {
                const error = new Error('Unauthorized access to child receipt details');
                error.statusCode = 403;
                throw error;
            }
        }
    }

    /**
     * Retrieves receipt metadata JSON
     */
    async getReceiptById(schoolId, receiptId, requester) {
        const receipt = await FeeReceiptRepository.findById(schoolId, receiptId);
        if (!receipt) {
            const error = new Error('Receipt not found');
            error.statusCode = 404;
            throw error;
        }

        await this._assertRequesterAccess(schoolId, receipt.student.studentId, requester);
        return receipt;
    }

    /**
     * Renders point-in-time receipt PDF streams
     */
    async getReceiptPDFStream(schoolId, receiptId, requester, responseStream) {
        const receipt = await FeeReceiptRepository.findById(schoolId, receiptId);
        if (!receipt) {
            const error = new Error('Receipt not found');
            error.statusCode = 404;
            throw error;
        }

        await this._assertRequesterAccess(schoolId, receipt.student.studentId, requester);

        // Render PDF directly into response stream
        generateReceiptPDF(receipt, responseStream);
    }

    /**
     * List all receipts for a student
     */
    async getStudentReceipts(schoolId, studentId, requester) {
        await this._assertRequesterAccess(schoolId, studentId, requester);
        return await FeeReceiptRepository.findByStudent(schoolId, studentId);
    }
}

module.exports = new FeeReceiptService();
