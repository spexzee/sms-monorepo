// apps/sm-payment-service/services/feeStructure.service.js

const FeeStructureRepository = require('../repositories/feeStructure.repository');
const { generateStructureId } = require('../utils/generateId');
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { FeeCategorySchema } = require("@sms/shared/models");

/**
 * FeeStructure Service
 * Orchestrates template updates, immutability check boundaries, cloning, and category references verification.
 */
class FeeStructureService {
    /**
     * Helper to validate category IDs existence
     */
    async _validateCategoriesExist(schoolId, feeItems) {
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        let FeeCategoryModel;
        try {
            FeeCategoryModel = schoolDb.model("FeeCategory");
        } catch (e) {
            FeeCategoryModel = schoolDb.model("FeeCategory", FeeCategorySchema);
        }

        const categoryIds = feeItems.map(item => item.feeCategoryId);
        const uniqueIds = [...new Set(categoryIds)];

        const activeCount = await FeeCategoryModel.countDocuments({
            schoolId,
            feeCategoryId: { $in: uniqueIds },
            isActive: true,
            isDeleted: false
        });

        if (activeCount !== uniqueIds.length) {
            const error = new Error('One or more fee category IDs are invalid or inactive');
            error.statusCode = 400;
            throw error;
        }
    }

    /**
     * Creates a new fee structure configuration (Draft status)
     */
    async createStructure(schoolId, createDto, actor) {
        await this._validateCategoriesExist(schoolId, createDto.feeItems);

        // Sort items by displayOrder to keep it clean
        const sortedItems = [...createDto.feeItems].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // Calculate total sum of fee items
        const totalFeeAmount = sortedItems.reduce((sum, item) => sum + Number(item.amount), 0);

        const newStructurePayload = {
            feeStructureId: generateStructureId(),
            schoolId,
            name: createDto.name.trim(),
            academicYear: createDto.academicYear,
            applicableClasses: createDto.applicableClasses,
            feeItems: sortedItems,
            installmentEnabled: !!createDto.installmentEnabled,
            installments: createDto.installmentEnabled ? createDto.installments : [],
            lateFeeEnabled: !!createDto.lateFeeEnabled,
            lateFeeRule: createDto.lateFeeEnabled ? createDto.lateFeeRule : null,
            status: "draft",
            totalFeeAmount,
            createdBy: actor?.userId || 'system',
            createdByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeStructureRepository.create(schoolId, newStructurePayload);
    }

    /**
     * Lists structures with query filters and sorting rules
     */
    async getStructures(schoolId, filters, pagination) {
        const { data, totalRecords } = await FeeStructureRepository.findAll(schoolId, filters, pagination);
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
     * Fetches structure by ID
     */
    async getStructureById(schoolId, structureId) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }
        return structure;
    }

    /**
     * Updates structure details (Locked if status !== draft)
     */
    async updateStructure(schoolId, structureId, updateDto, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        if (structure.status !== 'draft') {
            const error = new Error(`Cannot modify a fee structure that has already been ${structure.status}`);
            error.statusCode = 403;
            throw error;
        }

        const updateData = {};

        if (updateDto.name) updateData.name = updateDto.name.trim();
        if (updateDto.applicableClasses) updateData.applicableClasses = updateDto.applicableClasses;
        
        if (updateDto.feeItems) {
            await this._validateCategoriesExist(schoolId, updateDto.feeItems);
            updateData.feeItems = [...updateDto.feeItems].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
            updateData.totalFeeAmount = updateData.feeItems.reduce((sum, item) => sum + Number(item.amount), 0);
        }

        if (updateDto.installmentEnabled !== undefined) {
            updateData.installmentEnabled = !!updateDto.installmentEnabled;
            updateData.installments = updateDto.installmentEnabled ? updateDto.installments : [];
        } else if (structure.installmentEnabled && updateDto.installments) {
            updateData.installments = updateDto.installments;
        }

        if (updateDto.lateFeeEnabled !== undefined) {
            updateData.lateFeeEnabled = !!updateDto.lateFeeEnabled;
            updateData.lateFeeRule = updateDto.lateFeeEnabled ? updateDto.lateFeeRule : null;
        } else if (structure.lateFeeEnabled && updateDto.lateFeeRule) {
            updateData.lateFeeRule = updateDto.lateFeeRule;
        }

        updateData.updatedBy = actor?.userId || 'system';
        updateData.updatedByName = actor?.name || actor?.firstName || 'System Admin';

        return await FeeStructureRepository.update(schoolId, structureId, updateData);
    }

    /**
     * Publishes structure and locks it
     */
    async publishStructure(schoolId, structureId, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        if (structure.status !== 'draft') {
            const error = new Error(`Structure is already in '${structure.status}' status`);
            error.statusCode = 400;
            throw error;
        }

        const updateData = {
            status: 'published',
            publishedAt: new Date(),
            publishedBy: actor?.userId || 'system',
            publishedByName: actor?.name || actor?.firstName || 'System Admin',
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeStructureRepository.update(schoolId, structureId, updateData);
    }

    /**
     * Archives published structures
     */
    async archiveStructure(schoolId, structureId, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        if (structure.status !== 'published') {
            const error = new Error('Only published fee structures can be archived');
            error.statusCode = 400;
            throw error;
        }

        const updateData = {
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: actor?.userId || 'system',
            updatedBy: actor?.userId || 'system',
            updatedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeStructureRepository.update(schoolId, structureId, updateData);
    }

    /**
     * Clones active or archived configurations into new drafts
     */
    async cloneStructure(schoolId, structureId, newName, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        const cloneData = {
            schoolId,
            name: newName ? newName.trim() : `${structure.name} (Clone)`,
            academicYear: structure.academicYear,
            applicableClasses: structure.applicableClasses,
            feeItems: structure.feeItems,
            installmentEnabled: structure.installmentEnabled,
            installments: structure.installments,
            lateFeeEnabled: structure.lateFeeEnabled,
            lateFeeRule: structure.lateFeeRule,
            status: 'draft',
            totalFeeAmount: structure.totalFeeAmount,
            createdBy: actor?.userId || 'system',
            createdByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeStructureRepository.create(schoolId, cloneData);
    }

    /**
     * Soft-deletes a draft structure
     */
    async deleteStructure(schoolId, structureId, actor) {
        const structure = await FeeStructureRepository.findById(schoolId, structureId);
        if (!structure) {
            const error = new Error('Fee structure not found');
            error.statusCode = 404;
            throw error;
        }

        if (structure.status !== 'draft') {
            const error = new Error(`Cannot delete structure. It is currently in '${structure.status}' status`);
            error.statusCode = 403;
            throw error;
        }

        const deleteData = {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: actor?.userId || 'system',
            deletedByName: actor?.name || actor?.firstName || 'System Admin'
        };

        return await FeeStructureRepository.update(schoolId, structureId, deleteData);
    }
}

module.exports = new FeeStructureService();
