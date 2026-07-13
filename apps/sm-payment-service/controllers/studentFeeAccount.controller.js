// apps/sm-payment-service/controllers/studentFeeAccount.controller.js

const StudentFeeAccountService = require('../services/studentFeeAccount.service');
const StudentFeeAccountValidator = require('../validators/studentFeeAccount.validator');
const { AssignFeeStructureDTO, StudentFeeAccountResponseDTO } = require('../dto/studentFeeAccount.dto');

class StudentFeeAccountController {
    async assignStructure(req, res, next) {
        try {
            const { schoolId, structureId } = req.params;
            const validation = StudentFeeAccountValidator.validateAssign(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
            }
            const assignDto = new AssignFeeStructureDTO(req.body);
            const actor = req.user;

            const result = await StudentFeeAccountService.assignStructure(schoolId, structureId, assignDto, actor);

            return res.status(202).json({
                success: true,
                message: 'Assignment job executed successfully',
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getAccounts(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;
            const pagination = req.pagination;

            const result = await StudentFeeAccountService.getAccounts(schoolId, filters, pagination);

            return res.status(200).json({
                success: true,
                data: result.data.map(item => new StudentFeeAccountResponseDTO(item)),
                pagination: result.pagination
            });
        } catch (e) {
            next(e);
        }
    }

    async getAccountById(req, res, next) {
        try {
            const { schoolId, accountId } = req.params;

            const account = await StudentFeeAccountService.getAccountById(schoolId, accountId);

            return res.status(200).json({
                success: true,
                data: new StudentFeeAccountResponseDTO(account)
            });
        } catch (e) {
            next(e);
        }
    }

    async getAccountsByStudent(req, res, next) {
        try {
            const { schoolId, studentId } = req.params;
            const requester = req.user;

            const accounts = await StudentFeeAccountService.getAccountsByStudent(schoolId, studentId, requester);

            return res.status(200).json({
                success: true,
                data: accounts.map(item => new StudentFeeAccountResponseDTO(item))
            });
        } catch (e) {
            next(e);
        }
    }

    async freezeAccount(req, res, next) {
        try {
            const { schoolId, accountId } = req.params;
            const actor = req.user;

            const account = await StudentFeeAccountService.freezeAccount(schoolId, accountId, actor);

            return res.status(200).json({
                success: true,
                message: 'Account frozen successfully',
                data: new StudentFeeAccountResponseDTO(account)
            });
        } catch (e) {
            next(e);
        }
    }

    async unfreezeAccount(req, res, next) {
        try {
            const { schoolId, accountId } = req.params;
            const actor = req.user;

            const account = await StudentFeeAccountService.unfreezeAccount(schoolId, accountId, actor);

            return res.status(200).json({
                success: true,
                message: 'Account unfrozen successfully',
                data: new StudentFeeAccountResponseDTO(account)
            });
        } catch (e) {
            next(e);
        }
    }

    async transferOut(req, res, next) {
        try {
            const { schoolId, accountId } = req.params;
            const actor = req.user;
            const transferDto = req.body;

            const account = await StudentFeeAccountService.transferOut(schoolId, accountId, transferDto, actor);

            return res.status(200).json({
                success: true,
                message: 'Student account marked as transferred out successfully',
                data: new StudentFeeAccountResponseDTO(account)
            });
        } catch (e) {
            next(e);
        }
    }

    async updateAccountNotes(req, res, next) {
        try {
            const { schoolId, accountId } = req.params;
            const { adminNotes } = req.body;
            const actor = req.user;

            const account = await StudentFeeAccountService.updateAccountNotes(schoolId, accountId, adminNotes, actor);

            return res.status(200).json({
                success: true,
                message: 'Notes updated successfully',
                data: new StudentFeeAccountResponseDTO(account)
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new StudentFeeAccountController();
