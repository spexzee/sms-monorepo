// apps/sm-payment-service/controllers/feeCategory.controller.js

const FeeCategoryService = require('../services/feeCategory.service');
const FeeCategoryValidator = require('../validators/feeCategory.validator');
const { CreateFeeCategoryDTO, UpdateFeeCategoryDTO, FeeCategoryResponseDTO } = require('../dto/feeCategory.dto');

class FeeCategoryController {
    async createCategory(req, res, next) {
        try {
            const { schoolId } = req.params;
            const validation = FeeCategoryValidator.validateCreate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const createDto = new CreateFeeCategoryDTO(req.body);
            const actor = req.user;

            const category = await FeeCategoryService.createCategory(schoolId, createDto, actor);

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: new FeeCategoryResponseDTO(category)
            });
        } catch (e) {
            next(e);
        }
    }

    async getCategories(req, res, next) {
        try {
            const { schoolId } = req.params;
            const queryFilters = req.query;
            const pagination = req.pagination;

            const result = await FeeCategoryService.getCategories(schoolId, queryFilters, pagination);

            return res.status(200).json({
                success: true,
                data: result.data.map(item => new FeeCategoryResponseDTO(item)),
                pagination: result.pagination
            });
        } catch (e) {
            next(e);
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const { schoolId, categoryId } = req.params;

            const category = await FeeCategoryService.getCategoryById(schoolId, categoryId);

            return res.status(200).json({
                success: true,
                data: new FeeCategoryResponseDTO(category)
            });
        } catch (e) {
            next(e);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const { schoolId, categoryId } = req.params;
            const validation = FeeCategoryValidator.validateUpdate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const updateDto = new UpdateFeeCategoryDTO(req.body);
            const actor = req.user;

            const category = await FeeCategoryService.updateCategory(schoolId, categoryId, updateDto, actor);

            return res.status(200).json({
                success: true,
                message: 'Category updated successfully',
                data: new FeeCategoryResponseDTO(category)
            });
        } catch (e) {
            next(e);
        }
    }

    async toggleCategoryStatus(req, res, next) {
        try {
            const { schoolId, categoryId } = req.params;
            const actor = req.user;

            const category = await FeeCategoryService.toggleCategoryStatus(schoolId, categoryId, actor);

            return res.status(200).json({
                success: true,
                message: `Category marked as ${category.isActive ? 'active' : 'inactive'}`,
                data: new FeeCategoryResponseDTO(category)
            });
        } catch (e) {
            next(e);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            const { schoolId, categoryId } = req.params;
            const actor = req.user;

            await FeeCategoryService.deleteCategory(schoolId, categoryId, actor);

            return res.status(200).json({
                success: true,
                message: 'Category soft-deleted successfully'
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FeeCategoryController();
