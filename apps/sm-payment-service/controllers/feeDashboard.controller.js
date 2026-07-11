// apps/sm-payment-service/controllers/feeDashboard.controller.js

const FeeDashboardService = require('../services/feeDashboard.service');

class FeeDashboardController {
    async getDashboardStats(req, res, next) {
        try {
            const { schoolId } = req.params;
            const stats = await FeeDashboardService.getDashboardStats(schoolId);
            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (e) {
            next(e);
        }
    }

    async getDefaulters(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;
            const pagination = req.pagination;

            const result = await FeeDashboardService.getDefaulters(schoolId, filters, pagination);

            return res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (e) {
            next(e);
        }
    }

    async getPendingFees(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;

            const result = await FeeDashboardService.getPendingFees(schoolId, filters);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getTodayCollection(req, res, next) {
        try {
            const { schoolId } = req.params;

            const result = await FeeDashboardService.getTodayCollection(schoolId);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getMonthlyCollection(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { academicYear } = req.query;

            const result = await FeeDashboardService.getMonthlyCollection(schoolId, academicYear);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getClasswiseCollection(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { academicYear } = req.query;

            const result = await FeeDashboardService.getClasswiseCollection(schoolId, academicYear);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async getDiscountReport(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { academicYear } = req.query;

            const result = await FeeDashboardService.getDiscountReport(schoolId, academicYear);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (e) {
            next(e);
        }
    }

    async exportCollectionToExcel(req, res, next) {
        try {
            const { schoolId } = req.params;
            const filters = req.query;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=collection-report.csv');

            await FeeDashboardService.exportCollectionToExcel(schoolId, filters, res);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new FeeDashboardController();
