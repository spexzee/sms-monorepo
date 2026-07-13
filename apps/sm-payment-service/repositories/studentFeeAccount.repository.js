// apps/sm-payment-service/repositories/studentFeeAccount.repository.js

const BaseRepository = require('./base.repository');
const { StudentFeeAssignmentSchema } = require('@sms/shared/models');

/**
 * StudentFeeAccount Repository
 * Interacts with the Dynamic School MongoDB context to query and update student fee ledger accounts.
 */
class StudentFeeAccountRepository extends BaseRepository {
    constructor() {
        super('StudentFeeAssignment', StudentFeeAssignmentSchema);
    }

    /**
     * Saves a new student fee ledger account
     */
    async create(schoolId, data) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        const account = new StudentFeeAssignment(data);
        return await account.save();
    }

    /**
     * Finds single student fee assignment by its assignmentId
     */
    async findById(schoolId, assignmentId) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        return await StudentFeeAssignment.findOne({ schoolId, assignmentId, isDeleted: false });
    }

    /**
     * Finds a student's ledger account for a specific academic year
     */
    async findByStudentAndYear(schoolId, studentId, academicYear) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        return await StudentFeeAssignment.findOne({ schoolId, studentId, academicYear, isDeleted: false });
    }

    /**
     * Lists accounts matching filters (class, status, student search)
     */
    async findAll(schoolId, filters, pagination) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        const { classId, academicYear, status, search } = filters;
        const { limit = 10, skip = 0 } = pagination || {};

        const query = { schoolId, isDeleted: false };
        if (classId) query.classId = classId;
        if (academicYear) query.academicYear = academicYear;
        if (status) query.accountStatus = status;
        if (search) {
            query.studentName = { $regex: new RegExp(search.trim(), 'i') };
        }

        const totalRecords = await StudentFeeAssignment.countDocuments(query);
        const data = await StudentFeeAssignment.find(query)
            .sort({ studentName: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { data, totalRecords };
    }

    /**
     * Finds overdue accounts with outstanding balance
     */
    async getDefaulters(schoolId, classId, pagination) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        const { limit = 10, skip = 0 } = pagination || {};

        const query = {
            schoolId,
            accountStatus: 'overdue',
            totalBalance: { $gt: 0 },
            isDeleted: false
        };
        if (classId) query.classId = classId;

        const totalRecords = await StudentFeeAssignment.countDocuments(query);
        const data = await StudentFeeAssignment.find(query)
            .select('studentId studentName classId className sectionName rollNumber totalBalance lastTransactionDate')
            .sort({ totalBalance: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { data, totalRecords };
    }

    /**
     * Updates account ledger atomically
     */
    async update(schoolId, assignmentId, updateData) {
        const StudentFeeAssignment = await this.getModel(schoolId);
        return await StudentFeeAssignment.findOneAndUpdate(
            { schoolId, assignmentId, isDeleted: false },
            { $set: updateData },
            { new: true }
        );
    }
}

module.exports = new StudentFeeAccountRepository();
