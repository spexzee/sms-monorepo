// apps/sm-payment-service/repositories/feeCategory.repository.js

const BaseRepository = require('./base.repository');
const { FeeCategorySchema } = require('@sms/shared/models');

/**
 * FeeCategory Repository
 * Handles direct database access and queries using the multi-tenant compilation engine.
 */
class FeeCategoryRepository extends BaseRepository {
    constructor() {
        super('FeeCategory', FeeCategorySchema);
    }

    /**
     * Saves a new fee category record in the school database
     */
    async create(schoolId, newCategoryData) {
        const FeeCategory = await this.getModel(schoolId);
        const category = new FeeCategory(newCategoryData);
        return await category.save();
    }

    /**
     * Finds a single category by its feeCategoryId
     */
    async findById(schoolId, feeCategoryId) {
        const FeeCategory = await this.getModel(schoolId);
        return await FeeCategory.findOne({ schoolId, feeCategoryId, isDeleted: false });
    }

    /**
     * Case-insensitive name lookup for duplicate check
     */
    async findByName(schoolId, name) {
        const FeeCategory = await this.getModel(schoolId);
        return await FeeCategory.findOne({
            schoolId,
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
            isDeleted: false
        });
    }

    /**
     * Finds list of categories with query filters, search, and pagination
     */
    async findAll(schoolId, queryFilters, pagination) {
        const FeeCategory = await this.getModel(schoolId);
        const { isActive, categoryType, search } = queryFilters;
        const { limit = 10, skip = 0 } = pagination || {};

        const query = { schoolId, isDeleted: false };
        
        if (isActive !== undefined && isActive !== '') {
            query.isActive = isActive === 'true' || isActive === true;
        }
        if (categoryType) {
            query.categoryType = categoryType;
        }
        if (search) {
            query.name = { $regex: new RegExp(search.trim(), "i") };
        }

        const totalRecords = await FeeCategory.countDocuments(query);
        const data = await FeeCategory.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return { data, totalRecords };
    }

    /**
     * Applies atomic updates to category document
     */
    async update(schoolId, feeCategoryId, updateData) {
        const FeeCategory = await this.getModel(schoolId);
        return await FeeCategory.findOneAndUpdate(
            { schoolId, feeCategoryId, isDeleted: false },
            { $set: updateData },
            { new: true }
        );
    }
}

module.exports = new FeeCategoryRepository();
