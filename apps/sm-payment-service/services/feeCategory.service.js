// apps/sm-payment-service/services/feeCategory.service.js

const FeeCategoryRepository = require('../repositories/feeCategory.repository');
const { generateCategoryId } = require('../utils/generateId');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { FeeStructureSchema } = require("@sms/shared/models");

/**
 * FeeCategory Service
 * Orchestrates business logic rules, uniqueness validation, and structure references checking.
 */
class FeeCategoryService {
    /**
     * Creates a new fee category after asserting name uniqueness
     */
    async createCategory(schoolId, createDto, actor) {
        // Assert name uniqueness
        const existing = await FeeCategoryRepository.findByName(schoolId, createDto.name);
        if (existing) {
            const error = new Error('Category name already exists for this school');
            error.statusCode = 400;
            throw error;
        }

        const newCategoryPayload = {
            feeCategoryId: generateCategoryId(),
            schoolId,
            name: createDto.name.trim(),
            categoryType: createDto.categoryType,
            isRecurring: !!createDto.isRecurring,
            isMandatory: createDto.isMandatory !== undefined ? !!createDto.isMandatory : true,
            description: createDto.description ? createDto.description.trim() : '',
            createdBy: actor?.userId || 'system',
            createdByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeCategoryRepository.create(schoolId, newCategoryPayload);
    }

    /**
     * Lists categories using page filters
     */
    async getCategories(schoolId, queryFilters, pagination) {
        const { data, totalRecords } = await FeeCategoryRepository.findAll(schoolId, queryFilters, pagination);
        return {
            data,
            pagination: {
                totalRecords,
                currentPage: pagination.page,
                totalPages: Math.ceil(totalRecords / pagination.limit),
                limit: pagination.limit
            }
        };
    }

    /**
     * Gets category details by ID
     */
    async getCategoryById(schoolId, categoryId) {
        const category = await FeeCategoryRepository.findById(schoolId, categoryId);
        if (!category) {
            const error = new Error('Fee category not found');
            error.statusCode = 404;
            throw error;
        }
        return category;
    }

    /**
     * Updates category metadata with change assertions
     */
    async updateCategory(schoolId, categoryId, updateDto, actor) {
        const category = await FeeCategoryRepository.findById(schoolId, categoryId);
        if (!category) {
            const error = new Error('Fee category not found');
            error.statusCode = 404;
            throw error;
        }

        const updateData = {};

        // If name changes, assert uniqueness
        if (updateDto.name && updateDto.name.trim().toLowerCase() !== category.name.toLowerCase()) {
            const existing = await FeeCategoryRepository.findByName(schoolId, updateDto.name);
            if (existing) {
                const error = new Error('Category name already exists for this school');
                error.statusCode = 400;
                throw error;
            }
            updateData.name = updateDto.name.trim();
        }

        if (updateDto.categoryType) updateData.categoryType = updateDto.categoryType;
        if (updateDto.isRecurring !== undefined) updateData.isRecurring = !!updateDto.isRecurring;
        if (updateDto.isMandatory !== undefined) updateData.isMandatory = !!updateDto.isMandatory;
        if (updateDto.description !== undefined) updateData.description = updateDto.description.trim();

        updateData.updatedBy = actor?.userId || 'system';
        updateData.updatedByName = actor?.name || actor?.firstName || 'System Admin';

        return await FeeCategoryRepository.update(schoolId, categoryId, updateData);
    }

    /**
     * Toggles category isActive status
     */
    async toggleCategoryStatus(schoolId, categoryId, actor) {
        const category = await FeeCategoryRepository.findById(schoolId, categoryId);
        if (!category) {
            const error = new Error('Fee category not found');
            error.statusCode = 404;
            throw error;
        }

        const updateData = {
            isActive: !category.isActive,
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeCategoryRepository.update(schoolId, categoryId, updateData);
    }

    /**
     * Soft-deletes a category after verifying it is not referenced by any FeeStructure
     */
    async deleteCategory(schoolId, categoryId, actor) {
        const category = await FeeCategoryRepository.findById(schoolId, categoryId);
        if (!category) {
            const error = new Error('Fee category not found');
            error.statusCode = 404;
            throw error;
        }

        // Check if category is actively referenced in any published or draft fee structure
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        let FeeStructureModel;
        try {
            FeeStructureModel = schoolDb.model("FeeStructure");
        } catch (e) {
            FeeStructureModel = schoolDb.model("FeeStructure", FeeStructureSchema);
        }

        const structureInUse = await FeeStructureModel.findOne({
            schoolId,
            isDeleted: false,
            "feeItems.feeCategoryId": categoryId
        }).lean();

        if (structureInUse) {
            const error = new Error(`Cannot delete category. It is referenced in fee structure: '${structureInUse.name}'`);
            error.statusCode = 409;
            throw error;
        }

        const deleteData = {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: actor?.userId || 'system',
            deletedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeCategoryRepository.update(schoolId, categoryId, deleteData);
    }
}

module.exports = new FeeCategoryService();
