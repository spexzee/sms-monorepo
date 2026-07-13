// apps/sm-payment-service/repositories/base.repository.js

const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");

/**
 * Base Repository Class
 * Encapsulates Mongoose dynamic database compilation logic for multi-tenant school contexts.
 */
class BaseRepository {
    constructor(modelName, schema) {
        this.modelName = modelName;
        this.schema = schema;
    }

    /**
     * Resolves the school database Mongoose model dynamically based on tenant context ID
     * 
     * @param {string} schoolId 
     * @returns {Promise<Object>} - Mongoose Model
     */
    async getModel(schoolId) {
        if (!schoolId) {
            throw new Error("schoolId is required in repository helper");
        }
        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        try {
            // Model already registered on this connection — reuse it
            return schoolDb.model(this.modelName);
        } catch (e) {
            // Clone the schema before registering to prevent Mongoose from
            // mutating the shared schema instance across multiple connections,
            // which corrupts pre/post hook middleware and causes
            // "next is not a function" errors.
            return schoolDb.model(this.modelName, this.schema.clone());
        }
    }
}

module.exports = BaseRepository;
