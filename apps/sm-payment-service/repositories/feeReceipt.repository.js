// apps/sm-payment-service/repositories/feeReceipt.repository.js

const BaseRepository = require('./base.repository');
const { FeeReceiptSchema } = require('@sms/shared/models');

/**
 * FeeReceipt Repository
 * Interacts with the Dynamic School MongoDB context to query and update point-in-time legal receipts.
 */
class FeeReceiptRepository extends BaseRepository {
    constructor() {
        super('FeeReceipt', FeeReceiptSchema);
    }

    /**
     * Saves a new fee receipt document
     */
    async create(schoolId, data, session) {
        const FeeReceipt = await this.getModel(schoolId);
        const receipt = new FeeReceipt(data);
        return await receipt.save({ session });
    }

    /**
     * Finds single receipt by receiptId
     */
    async findById(schoolId, receiptId) {
        const FeeReceipt = await this.getModel(schoolId);
        return await FeeReceipt.findOne({ schoolId, receiptId, isDeleted: false });
    }

    /**
     * Finds receipt history associated with student
     */
    async findByStudent(schoolId, studentId) {
        const FeeReceipt = await this.getModel(schoolId);
        return await FeeReceipt.find({
            schoolId,
            'student.studentId': studentId,
            isDeleted: false
        }).sort({ createdAt: -1 }).lean();
    }

    /**
     * Atomically marks a receipt as void (reversed payments)
     */
    async updateVoidStatus(schoolId, receiptId, voidReason, voidedBy, voidedByName) {
        const FeeReceipt = await this.getModel(schoolId);
        return await FeeReceipt.findOneAndUpdate(
            { schoolId, receiptId, isDeleted: false },
            {
                $set: {
                    isVoided: true,
                    voidedAt: new Date(),
                    voidedBy,
                    voidedByName,
                    voidReason
                }
            },
            { new: true }
        );
    }
}

module.exports = new FeeReceiptRepository();
