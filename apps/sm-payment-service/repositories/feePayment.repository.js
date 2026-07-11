// apps/sm-payment-service/repositories/feePayment.repository.js

const BaseRepository = require('./base.repository');
const { FeeTransactionSchema } = require('@sms/shared/models');

/**
 * FeePayment Repository
 * Interacts with the Mongoose dynamically compiled models for school fee transactions logs.
 */
class FeePaymentRepository extends BaseRepository {
    constructor() {
        super('FeeTransaction', FeeTransactionSchema);
    }

    /**
     * Saves a new payment transaction log (normally handled via transactionHelper)
     */
    async create(schoolId, data, session) {
        const FeeTransaction = await this.getModel(schoolId);
        const transaction = new FeeTransaction(data);
        return await transaction.save({ session });
    }

    /**
     * Finds single transaction by its transactionId
     */
    async findById(schoolId, transactionId) {
        const FeeTransaction = await this.getModel(schoolId);
        return await FeeTransaction.findOne({ schoolId, transactionId, isDeleted: false });
    }

    /**
     * Lists payment transactions matching filters (date, mode, studentId)
     */
    async findAll(schoolId, filters, pagination) {
        const FeeTransaction = await this.getModel(schoolId);
        const { studentId, paymentMode, startDate, endDate } = filters;
        const { limit = 10, skip = 0 } = pagination || {};

        const query = { schoolId, type: 'payment', isDeleted: false };
        if (studentId) query.studentId = studentId;
        if (paymentMode) query.paymentMode = paymentMode;

        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const totalRecords = await FeeTransaction.countDocuments(query);
        const data = await FeeTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { data, totalRecords };
    }

    /**
     * Finds all payment transaction logs associated with a student
     */
    async findByStudent(schoolId, studentId) {
        const FeeTransaction = await this.getModel(schoolId);
        return await FeeTransaction.find({
            schoolId,
            studentId,
            type: 'payment',
            isDeleted: false
        }).sort({ createdAt: -1 }).lean();
    }

    /**
     * Aggregates the total amount received today
     */
    async sumTodayCollections(schoolId, startOfToday) {
        const FeeTransaction = await this.getModel(schoolId);
        const result = await FeeTransaction.aggregate([
            {
                $match: {
                    schoolId,
                    type: 'payment',
                    createdAt: { $gte: startOfToday },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        return result[0]?.total || 0;
    }
}

module.exports = new FeePaymentRepository();
