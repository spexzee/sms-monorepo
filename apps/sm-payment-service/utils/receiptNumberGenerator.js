const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("./schoolDbHelper");
const { FeeReceiptCounterSchema } = require("@sms/shared/models");

/**
 * Gets the FeeReceiptCounter Mongoose model dynamically for the school's database connection
 */
const getFeeReceiptCounterModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    try {
        return schoolDb.model("FeeReceiptCounter");
    } catch (e) {
        return schoolDb.model("FeeReceiptCounter", FeeReceiptCounterSchema);
    }
};

/**
 * Atomically increments the receipt counter and generates a unique receipt number
 * Format: SMS/YYYY-YY/000001 (e.g. SMS/2026-27/000042)
 *
 * @param {string} schoolId
 * @param {string} academicYear - Full academic year string (e.g. "2026-2027")
 * @returns {Promise<string>} - Padded and formatted receipt number
 */
const generateReceiptNumber = async (schoolId, academicYear) => {
    if (!schoolId || !academicYear) {
        throw new Error("schoolId and academicYear are required to generate receipt number");
    }

    const parts = academicYear.split("-");
    if (parts.length !== 2) {
        throw new Error("academicYear must be in format YYYY-YYYY");
    }

    const shortYear = `${parts[0]}-${parts[1].substring(2)}`; // e.g. "2026-27"

    const FeeReceiptCounter = await getFeeReceiptCounterModel(schoolId);

    // Atomically increment counter, creating a new document if it doesn't exist
    const counter = await FeeReceiptCounter.findOneAndUpdate(
        { schoolId, academicYear },
        { $inc: { lastNumber: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const paddedNumber = String(counter.lastNumber).padStart(6, '0');
    return `SMS/${shortYear}/${paddedNumber}`;
};

module.exports = {
    generateReceiptNumber
};
