// apps/sm-payment-service/repositories/feeStructure.repository.js

const BaseRepository = require('./base.repository');
const { FeeStructureSchema } = require('@sms/shared/models');

/**
 * FeeStructure Repository
 * Interacts with the Dynamic School MongoDB context to manage fee structure configuration templates.
 */
class FeeStructureRepository extends BaseRepository {
    constructor() {
        super('FeeStructure', FeeStructureSchema);
    }

    /**
     * Saves a new fee structure configuration (Draft by default)
     */
    async create(schoolId, newStructureData) {
        const FeeStructure = await this.getModel(schoolId);
        const structure = new FeeStructure(newStructureData);
        return await structure.save();
    }

    /**
     * Finds structure details by ID
     */
    async findById(schoolId, feeStructureId) {
        const FeeStructure = await this.getModel(schoolId);
        return await FeeStructure.findOne({ schoolId, feeStructureId, isDeleted: false });
    }

    /**
     * Queries structures using filters, status, and pagination
     */
    async findAll(schoolId, filters, pagination) {
        const FeeStructure = await this.getModel(schoolId);
        const { academicYear, status, search } = filters;
        const { limit = 10, skip = 0 } = pagination || {};

        const query = { schoolId, isDeleted: false };
        if (academicYear) query.academicYear = academicYear;
        if (status) query.status = status;
        if (search) {
            query.name = { $regex: new RegExp(search.trim(), 'i') };
        }

        const totalRecords = await FeeStructure.countDocuments(query);
        const data = await FeeStructure.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { data, totalRecords };
    }

    /**
     * Updates structure details (locks will be evaluated at Service layer)
     */
    async update(schoolId, feeStructureId, updateData) {
        const FeeStructure = await this.getModel(schoolId);
        return await FeeStructure.findOneAndUpdate(
            { schoolId, feeStructureId, isDeleted: false },
            { $set: updateData },
            { new: true }
        );
    }
}

module.exports = new FeeStructureRepository();
