// apps/sm-payment-service/controllers/feeStructure.controller.js

const FeeStructureService = require('../services/feeStructure.service');
const FeeStructureValidator = require('../validators/feeStructure.validator');
const { CreateFeeStructureDTO, UpdateFeeStructureDTO, FeeStructureResponseDTO } = require('../dto/feeStructure.dto');

class FeeStructureController {
    async createStructure(req, res, next) {
        try {
            const { schoolId } = req.params;
            const validation = FeeStructureValidator.validateCreate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const createDto = new CreateFeeStructureDTO(req.body);
            const actor = req.user;

            const structure = await FeeStructureService.createStructure(schoolId, createDto, actor);

            return res.status(201).json({
                success: true,
                message: 'Structure created successfully as draft',
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async getStructures(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;
            const pagination = req.pagination;

            const result = await FeeStructureService.getStructures(schoolId, filters, pagination);

            return res.status(200).json({
                success: true,
                data: result.data.map(item => new FeeStructureResponseDTO(item)),
                pagination: result.pagination
            });
        } catch (e) {
            next(e);
        }
    }

    async getStructureById(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;

            const structure = await FeeStructureService.getStructureById(schoolId, structureId);

            return res.status(200).json({
                success: true,
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async updateStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const validation = FeeStructureValidator.validateUpdate(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const updateDto = new UpdateFeeStructureDTO(req.body);
            const actor = req.user;

            const structure = await FeeStructureService.updateStructure(schoolId, structureId, updateDto, actor);

            return res.status(200).json({
                success: true,
                message: 'Structure updated successfully',
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async publishStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const actor = req.user;

            const structure = await FeeStructureService.publishStructure(schoolId, structureId, actor);

            return res.status(200).json({
                success: true,
                message: 'Structure published and locked successfully',
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async archiveStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const actor = req.user;

            const structure = await FeeStructureService.archiveStructure(schoolId, structureId, actor);

            return res.status(200).json({
                success: true,
                message: 'Structure archived successfully',
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async cloneStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const { newName } = req.body;
            const actor = req.user;

            const structure = await FeeStructureService.cloneStructure(schoolId, structureId, newName, actor);

            return res.status(201).json({
                success: true,
                message: 'Structure cloned successfully',
                data: new FeeStructureResponseDTO(structure)
            });
        } catch (e) {
            next(e);
        }
    }

    async deleteStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const actor = req.user;

            await FeeStructureService.deleteStructure(schoolId, structureId, actor);

            return res.status(200).json({
                success: true,
                message: 'Structure deleted successfully'
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FeeStructureController();
