// apps/sm-payment-service/services/feeDashboard.service.js

const StudentFeeAccountRepository = require('../repositories/studentFeeAccount.repository');
const FeePaymentRepository = require('../repositories/feePayment.repository');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { StudentDiscountSchema } = require("@sms/shared/models");

/**
 * FeeDashboard & Reports Service
 * Performs MongoDB Aggregations to output collections summary reports, defaulters, and CSV export.
 */
class FeeDashboardService {
    /**
     * Helper to get student discount model dynamically
     */
    async _getStudentDiscountModel(schoolId) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            return schoolDb.model("StudentDiscount");
        } catch (e) {
            return schoolDb.model("StudentDiscount", StudentDiscountSchema.clone());
        }
    }

    /**
     * Resolves general aggregated statistics summary for the admin dashboard
     */
    async getDashboardStats(schoolId) {
        const AccountModel = await StudentFeeAccountRepository.getModel(schoolId);
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);

        // Core aggregate totals
        const summary = await AccountModel.aggregate([
            { $match: { schoolId, isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalExpected: { $sum: "$netFees" },
                    totalCollected: { $sum: "$totalPaid" },
                    totalOutstanding: { $sum: "$totalBalance" },
                    totalDefaulters: {
                        $sum: {
                            $cond: [{ $eq: ["$accountStatus", "overdue"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const stats = summary[0] || {
            totalExpected: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            totalDefaulters: 0
        };

        // Today's collections sum
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayCollection = await TransactionModel.aggregate([
            {
                $match: {
                    schoolId,
                    type: "payment",
                    createdAt: { $gte: startOfToday },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const todayTotal = todayCollection[0]?.total || 0;
        const collectionPercentage = stats.totalExpected > 0
            ? Math.round((stats.totalCollected / stats.totalExpected) * 10000) / 100
            : 0;

        return {
            totalExpected: stats.totalExpected,
            totalCollected: stats.totalCollected,
            totalOutstanding: stats.totalOutstanding,
            totalStudentsWithDues: stats.totalDefaulters,
            todayCollection: todayTotal,
            collectionPercentage
        };
    }

    /**
     * Returns list of defaulters (students with overdue status)
     */
    async getDefaulters(schoolId, filters, pagination) {
        return await StudentFeeAccountRepository.getDefaulters(schoolId, filters.classId, pagination);
    }

    /**
     * Returns Pending Fees report grouped by Class
     */
    async getPendingFees(schoolId, filters) {
        const AccountModel = await StudentFeeAccountRepository.getModel(schoolId);
        const query = { schoolId, isDeleted: false };
        if (filters.academicYear) query.academicYear = filters.academicYear;

        return await AccountModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$classId",
                    className: { $first: "$className" },
                    totalExpected: { $sum: "$netFees" },
                    totalCollected: { $sum: "$totalPaid" },
                    totalPending: { $sum: "$totalBalance" },
                    defaultersCount: {
                        $sum: {
                            $cond: [{ $gt: ["$totalBalance", 0] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { className: 1 } }
        ]);
    }

    /**
     * Returns Today's collections details split by payment modes
     */
    async getTodayCollection(schoolId) {
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const breakdown = await TransactionModel.aggregate([
            {
                $match: {
                    schoolId,
                    type: "payment",
                    createdAt: { $gte: startOfToday },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: "$paymentMode",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        return breakdown;
    }

    /**
     * Returns Monthly Collection report
     */
    async getMonthlyCollection(schoolId, academicYear) {
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);
        const query = { schoolId, type: "payment", isDeleted: false };
        if (academicYear) query.academicYear = academicYear;

        return await TransactionModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        month: { $month: "$paymentDate" },
                        year: { $year: "$paymentDate" }
                    },
                    totalAmount: { $sum: "$amount" },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }
        ]);
    }

    /**
     * Returns Class-wise collection totals
     */
    async getClasswiseCollection(schoolId, academicYear) {
        const AccountModel = await StudentFeeAccountRepository.getModel(schoolId);
        const query = { schoolId, isDeleted: false };
        if (academicYear) query.academicYear = academicYear;

        return await AccountModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$classId",
                    className: { $first: "$className" },
                    totalCollected: { $sum: "$totalPaid" },
                    totalExpected: { $sum: "$netFees" }
                }
            },
            { $sort: { className: 1 } }
        ]);
    }

    /**
     * Returns applied discounts and scholarships report
     */
    async getDiscountReport(schoolId, academicYear) {
        const StudentDiscountModel = await this._getStudentDiscountModel(schoolId);
        const query = { schoolId };
        if (academicYear) query.academicYear = academicYear;

        return await StudentDiscountModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$discountId",
                    discountName: { $first: "$discountName" },
                    totalWaived: { $sum: "$computedAmount" },
                    appliedCount: { $sum: 1 }
                }
            },
            { $sort: { totalWaived: -1 } }
        ]);
    }

    /**
     * Exports payment logs to CSV stream compatible with Excel
     */
    async exportCollectionToExcel(schoolId, filters, responseStream) {
        const TransactionModel = await FeePaymentRepository.getModel(schoolId);
        const query = { schoolId, type: "payment", isDeleted: false };
        
        if (filters.startDate || filters.endDate) {
            query.paymentDate = {};
            if (filters.startDate) query.paymentDate.$gte = new Date(filters.startDate);
            if (filters.endDate) query.paymentDate.$lte = new Date(filters.endDate);
        }

        const payments = await TransactionModel.find(query).sort({ paymentDate: -1 }).lean();

        // Write CSV headers
        responseStream.write("Transaction ID,Student ID,Student Name,Academic Year,Payment Date,Payment Mode,Reference Number,Amount Received,Collector\n");

        payments.forEach((p) => {
            const date = new Date(p.paymentDate).toLocaleDateString();
            const cleanName = p.studentName.replace(/"/g, '""');
            responseStream.write(`"${p.transactionId}","${p.studentId}","${cleanName}","${p.academicYear}","${date}","${p.paymentMode.toUpperCase()}","${p.referenceNumber || ''}",${p.amount},"${p.createdByName || ''}"\n`);
        });

        responseStream.end();
    }
}

module.exports = new FeeDashboardService();
