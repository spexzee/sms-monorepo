const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { FeeDiscountSchema, StudentDiscountSchema } = require("@sms/shared/models");
const { generateDiscountId } = require("../utils/generateId");

// Helper to get dynamically compiled models for school db
const getDiscountModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("FeeDiscount");
    } catch (e) {
        return schoolDb.model("FeeDiscount", FeeDiscountSchema);
    }
};

const getStudentDiscountModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("StudentDiscount");
    } catch (e) {
        return schoolDb.model("StudentDiscount", StudentDiscountSchema);
    }
};

/**
 * Create a new Fee Discount Template
 * POST /api/school/:schoolId/fees/discounts
 */
const createDiscount = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, description, discountType, discountValue, appliesTo, specificCategoryId } = req.body;

        if (!name || !discountType || discountValue === undefined || !appliesTo) {
            return res.status(400).json({
                success: false,
                message: "name, discountType, discountValue, and appliesTo are required"
            });
        }

        const value = Number(discountValue);
        if (isNaN(value) || value <= 0) {
            return res.status(400).json({ success: false, message: "discountValue must be a positive number" });
        }
        if (discountType === 'percentage' && value > 100) {
            return res.status(400).json({ success: false, message: "percentage discountValue cannot exceed 100" });
        }

        const DiscountModel = await getDiscountModel(schoolId);

        const discount = new DiscountModel({
            discountId: generateDiscountId(),
            schoolId,
            name: name.trim(),
            description: description ? description.trim() : "",
            discountType,
            discountValue: value,
            appliesTo,
            specificCategoryId: appliesTo === 'specific_category' ? specificCategoryId : null,
            isActive: true,
            createdBy: req.user?.userId || "system"
        });

        await discount.save();

        return res.status(201).json({
            success: true,
            message: "Fee discount template created successfully",
            data: discount
        });
    } catch (error) {
        console.error("Error creating fee discount template:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * List all Fee Discount Templates
 * GET /api/school/:schoolId/fees/discounts
 */
const getDiscounts = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const DiscountModel = await getDiscountModel(schoolId);

        const discounts = await DiscountModel.find({ schoolId, isActive: true }).sort({ name: 1 }).lean();

        return res.status(200).json({
            success: true,
            data: discounts
        });
    } catch (error) {
        console.error("Error getting discount templates:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * Update Fee Discount Template
 * PUT /api/school/:schoolId/fees/discounts/:discountId
 */
const updateDiscount = async (req, res) => {
    try {
        const { schoolId, discountId } = req.params;
        const { name, description, discountType, discountValue, appliesTo, specificCategoryId, isActive } = req.body;

        const DiscountModel = await getDiscountModel(schoolId);

        const discount = await DiscountModel.findOne({ schoolId, discountId });
        if (!discount) {
            return res.status(404).json({ success: false, message: "Discount template not found" });
        }

        if (name) discount.name = name.trim();
        if (description !== undefined) discount.description = description.trim();
        if (discountType) discount.discountType = discountType;
        
        if (discountValue !== undefined) {
            const val = Number(discountValue);
            if (isNaN(val) || val <= 0) {
                return res.status(400).json({ success: false, message: "discountValue must be positive" });
            }
            discount.discountValue = val;
        }

        if (appliesTo) {
            discount.appliesTo = appliesTo;
            discount.specificCategoryId = appliesTo === 'specific_category' ? specificCategoryId : null;
        }

        if (isActive !== undefined) discount.isActive = !!isActive;

        await discount.save();

        return res.status(200).json({
            success: true,
            message: "Discount template updated successfully",
            data: discount
        });
    } catch (error) {
        console.error("Error updating discount template:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

/**
 * Delete Fee Discount Template (only if not applied to any students)
 * DELETE /api/school/:schoolId/fees/discounts/:discountId
 */
const deleteDiscount = async (req, res) => {
    try {
        const { schoolId, discountId } = req.params;

        const DiscountModel = await getDiscountModel(schoolId);
        const StudentDiscountModel = await getStudentDiscountModel(schoolId);

        const discount = await DiscountModel.findOne({ schoolId, discountId });
        if (!discount) {
            return res.status(404).json({ success: false, message: "Discount template not found" });
        }

        // Check usage
        const inUse = await StudentDiscountModel.findOne({ schoolId, discountId });
        if (inUse) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete discount template; it is actively applied to students"
            });
        }

        await DiscountModel.deleteOne({ schoolId, discountId });

        return res.status(200).json({
            success: true,
            message: "Discount template deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting discount template:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = {
    createDiscount,
    getDiscounts,
    updateDiscount,
    deleteDiscount
};
