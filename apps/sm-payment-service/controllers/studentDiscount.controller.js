// apps/sm-payment-service/controllers/studentDiscount.controller.js

const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { StudentFeeAssignmentSchema } = require("@sms/shared/models");
const { recalculateAccount } = require("../utils/accountHelper");
const mongoose = require("mongoose");

// ── Inline schemas (discount models are only used within this service) ─────────

const _FeeDiscountSchema = new mongoose.Schema(
    {
        discountId:         { type: String, required: true, unique: true },
        schoolId:           { type: String, required: true, index: true },
        name:               { type: String, required: true, trim: true },
        description:        { type: String, default: '' },
        discountType:       { type: String, required: true, enum: ['percentage', 'flat'] },
        discountValue:      { type: Number, required: true, min: 0 },
        appliesTo:          { type: String, required: true, enum: ['all_fees', 'tuition_only', 'specific_category'] },
        specificCategoryId: { type: String, default: null },
        isActive:           { type: Boolean, default: true },
        createdBy:          { type: String, default: 'system' }
    },
    { timestamps: true, collection: 'feediscounts' }
);

const _StudentDiscountSchema = new mongoose.Schema(
    {
        studentDiscountId:  { type: String, required: true, unique: true },
        schoolId:           { type: String, required: true, index: true },
        studentId:          { type: String, required: true },
        discountId:         { type: String, required: true },
        discountName:       { type: String, required: true },
        discountType:       { type: String, enum: ['percentage', 'flat'], required: true },
        discountValue:      { type: Number, required: true },
        appliesTo:          { type: String, enum: ['all_fees', 'tuition_only', 'specific_category'], required: true },
        specificCategoryId: { type: String, default: null },
        amountWaived:       { type: Number, default: 0 },
        feeAccountId:       { type: String, default: null },
        appliedBy:          { type: String, default: 'system' },
        appliedAt:          { type: Date, default: Date.now },
        isActive:           { type: Boolean, default: true }
    },
    { timestamps: true, collection: 'studentdiscounts' }
);

const getDiscountModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("FeeDiscount");
    } catch (e) {
        return schoolDb.model("FeeDiscount", _FeeDiscountSchema.clone());
    }
};

const getStudentDiscountModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("StudentDiscount");
    } catch (e) {
        return schoolDb.model("StudentDiscount", _StudentDiscountSchema.clone());
    }
};

const getStudentFeeAssignmentModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("StudentFeeAssignment");
    } catch (e) {
        return schoolDb.model("StudentFeeAssignment", StudentFeeAssignmentSchema.clone());
    }
};

class StudentDiscountController {
    /**
     * Apply Discount Template to Student Fee Account
     * POST /api/school/:schoolId/fees/student-discounts/apply
     */
    async applyDiscount(req, res, next) {
        try {
            const { schoolId } = req.params;
            const { studentId, discountId, discountTemplateId, feeAccountId } = req.body;

            const targetDiscountId = discountId || discountTemplateId;
            if (!studentId || !targetDiscountId) {
                return res.status(400).json({
                    success: false,
                    message: "studentId and discountId (or discountTemplateId) are required"
                });
            }

            const DiscountModel = await getDiscountModel(schoolId);
            const StudentDiscountModel = await getStudentDiscountModel(schoolId);
            const StudentFeeAssignmentModel = await getStudentFeeAssignmentModel(schoolId);

            // 1. Fetch discount template
            const discountTemplate = await DiscountModel.findOne({ schoolId, discountId: targetDiscountId, isActive: true });
            if (!discountTemplate) {
                return res.status(404).json({ success: false, message: "Active discount template not found" });
            }

            // 2. Fetch student's fee ledger account
            let account;
            if (feeAccountId) {
                account = await StudentFeeAssignmentModel.findOne({ schoolId, assignmentId: feeAccountId, isDeleted: false });
            } else {
                // Find latest academic year ledger
                account = await StudentFeeAssignmentModel.findOne({ schoolId, studentId, isDeleted: false })
                    .sort({ academicYear: -1 });
            }

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: "No active fee assignment ledger found for this student"
                });
            }

            // 3. Prevent duplicate application of the same discount template on this ledger
            const existing = await StudentDiscountModel.findOne({
                schoolId,
                studentId,
                discountId: targetDiscountId,
                feeAccountId: account.assignmentId,
                isActive: true
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Discount '${discountTemplate.name}' is already applied to this student's fee account.`
                });
            }

            // 4. Calculate and apply the discount amounts to the breakdown categories
            let totalWaiverAdded = 0;
            const val = discountTemplate.discountValue;

            if (discountTemplate.appliesTo === 'specific_category') {
                const targetCatId = discountTemplate.specificCategoryId;
                let found = false;
                account.feeBreakdown.forEach(item => {
                    if (item.feeCategoryId === targetCatId) {
                        found = true;
                        const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                        let itemDiscount = 0;
                        if (discountTemplate.discountType === 'percentage') {
                            itemDiscount = Math.round(baseAmt * (val / 100));
                        } else {
                            itemDiscount = val;
                        }
                        // Cap discount amount at remaining balance before this discount
                        const maxAllowed = Math.max(0, baseAmt - (item.waivedAmount || 0) - (item.discountAmount || 0));
                        const finalDiscount = Math.min(itemDiscount, maxAllowed);

                        item.discountAmount = (item.discountAmount || 0) + finalDiscount;
                        totalWaiverAdded += finalDiscount;
                    }
                });

                if (!found) {
                    return res.status(400).json({
                        success: false,
                        message: `Fee category with ID '${targetCatId}' is not part of this student's fee structure.`
                    });
                }
            } else if (discountTemplate.appliesTo === 'tuition_only') {
                let found = false;
                account.feeBreakdown.forEach(item => {
                    const name = (item.categoryName || '').toLowerCase();
                    if (name === 'tuition' || name === 'tuition fee' || name === 'tuition fees') {
                        found = true;
                        const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                        let itemDiscount = 0;
                        if (discountTemplate.discountType === 'percentage') {
                            itemDiscount = Math.round(baseAmt * (val / 100));
                        } else {
                            itemDiscount = val;
                        }
                        const maxAllowed = Math.max(0, baseAmt - (item.waivedAmount || 0) - (item.discountAmount || 0));
                        const finalDiscount = Math.min(itemDiscount, maxAllowed);

                        item.discountAmount = (item.discountAmount || 0) + finalDiscount;
                        totalWaiverAdded += finalDiscount;
                    }
                });

                if (!found) {
                    return res.status(400).json({
                        success: false,
                        message: "Tuition fee category not found in this student's fee structure."
                    });
                }
            } else {
                // appliesTo === 'all_fees'
                if (discountTemplate.discountType === 'percentage') {
                    account.feeBreakdown.forEach(item => {
                        const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                        const itemDiscount = Math.round(baseAmt * (val / 100));
                        const maxAllowed = Math.max(0, baseAmt - (item.waivedAmount || 0) - (item.discountAmount || 0));
                        const finalDiscount = Math.min(itemDiscount, maxAllowed);

                        item.discountAmount = (item.discountAmount || 0) + finalDiscount;
                        totalWaiverAdded += finalDiscount;
                    });
                } else {
                    // flat amount distributed proportionally
                    const totalBase = account.feeBreakdown.reduce((sum, item) => sum + (item.originalAmount || 0) + (item.adjustments || 0), 0);
                    if (totalBase > 0) {
                        let remainingFlat = val;
                        account.feeBreakdown.forEach((item, idx) => {
                            const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                            let itemDiscount = 0;
                            if (idx === account.feeBreakdown.length - 1) {
                                itemDiscount = remainingFlat;
                            } else {
                                itemDiscount = Math.round(val * (baseAmt / totalBase));
                                remainingFlat -= itemDiscount;
                            }
                            const maxAllowed = Math.max(0, baseAmt - (item.waivedAmount || 0) - (item.discountAmount || 0));
                            const finalDiscount = Math.min(itemDiscount, maxAllowed);

                            item.discountAmount = (item.discountAmount || 0) + finalDiscount;
                            totalWaiverAdded += finalDiscount;
                        });
                    }
                }
            }

            // 5. Recalculate ledger totals
            recalculateAccount(account);
            await account.save();

            // 6. Record applied student discount log
            const studentDiscountId = "SDIST-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            const studentDiscount = new StudentDiscountModel({
                studentDiscountId,
                schoolId,
                studentId,
                discountId: targetDiscountId,
                discountName: discountTemplate.name,
                discountType: discountTemplate.discountType,
                discountValue: val,
                appliesTo: discountTemplate.appliesTo,
                specificCategoryId: discountTemplate.specificCategoryId,
                amountWaived: totalWaiverAdded,
                feeAccountId: account.assignmentId,
                appliedBy: req.user?.userId || "system",
                appliedAt: new Date(),
                isActive: true
            });
            await studentDiscount.save();

            return res.status(201).json({
                success: true,
                message: `Discount '${discountTemplate.name}' applied successfully. Total discount: ₹${totalWaiverAdded}`,
                data: studentDiscount
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove Discount from Student Fee Account
     * DELETE /api/school/:schoolId/fees/student-discounts/apply/:studentDiscountId
     */
    async removeDiscount(req, res, next) {
        try {
            const { schoolId, studentDiscountId } = req.params;

            const StudentDiscountModel = await getStudentDiscountModel(schoolId);
            const StudentFeeAssignmentModel = await getStudentFeeAssignmentModel(schoolId);

            const record = await StudentDiscountModel.findOne({ schoolId, studentDiscountId, isActive: true });
            if (!record) {
                return res.status(404).json({ success: false, message: "Applied student discount record not found" });
            }

            const account = await StudentFeeAssignmentModel.findOne({ schoolId, assignmentId: record.feeAccountId, isDeleted: false });
            if (account) {
                // Reverse the discount amount from breakdown categories
                const val = record.discountValue;
                if (record.appliesTo === 'specific_category') {
                    account.feeBreakdown.forEach(item => {
                        if (item.feeCategoryId === record.specificCategoryId) {
                            const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                            let itemDiscount = 0;
                            if (record.discountType === 'percentage') {
                                itemDiscount = Math.round(baseAmt * (val / 100));
                            } else {
                                itemDiscount = val;
                            }
                            item.discountAmount = Math.max(0, (item.discountAmount || 0) - itemDiscount);
                        }
                    });
                } else if (record.appliesTo === 'tuition_only') {
                    account.feeBreakdown.forEach(item => {
                        const name = (item.categoryName || '').toLowerCase();
                        if (name === 'tuition' || name === 'tuition fee' || name === 'tuition fees') {
                            const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                            let itemDiscount = 0;
                            if (record.discountType === 'percentage') {
                                itemDiscount = Math.round(baseAmt * (val / 100));
                            } else {
                                itemDiscount = val;
                            }
                            item.discountAmount = Math.max(0, (item.discountAmount || 0) - itemDiscount);
                        }
                    });
                } else {
                    if (record.discountType === 'percentage') {
                        account.feeBreakdown.forEach(item => {
                            const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                            const itemDiscount = Math.round(baseAmt * (val / 100));
                            item.discountAmount = Math.max(0, (item.discountAmount || 0) - itemDiscount);
                        });
                    } else {
                        const totalBase = account.feeBreakdown.reduce((sum, item) => sum + (item.originalAmount || 0) + (item.adjustments || 0), 0);
                        if (totalBase > 0) {
                            let remainingFlat = val;
                            account.feeBreakdown.forEach((item, idx) => {
                                const baseAmt = (item.originalAmount || 0) + (item.adjustments || 0);
                                let itemDiscount = 0;
                                if (idx === account.feeBreakdown.length - 1) {
                                    itemDiscount = remainingFlat;
                                } else {
                                    itemDiscount = Math.round(val * (baseAmt / totalBase));
                                    remainingFlat -= itemDiscount;
                                }
                                item.discountAmount = Math.max(0, (item.discountAmount || 0) - itemDiscount);
                            });
                        }
                    }
                }

                recalculateAccount(account);
                await account.save();
            }

            // Soft-delete or flag the log as inactive
            record.isActive = false;
            await record.save();

            return res.status(200).json({
                success: true,
                message: "Discount reverted/removed successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * View applied student discounts
     * GET /api/school/:schoolId/fees/student-discounts/student/:studentId
     */
    async getStudentDiscounts(req, res, next) {
        try {
            const { schoolId, studentId } = req.params;
            const StudentDiscountModel = await getStudentDiscountModel(schoolId);

            const list = await StudentDiscountModel.find({ schoolId, studentId, isActive: true })
                .sort({ appliedAt: -1 })
                .lean();

            return res.status(200).json({
                success: true,
                data: list
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new StudentDiscountController();
