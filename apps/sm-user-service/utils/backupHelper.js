const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

// Cache for backup database connections
const backupDbConnections = {};

/**
 * Get a connection to a school's backup database.
 * Naming: backup-{schoolDbName}
 * e.g., backup-school-db-springfield-elementary
 */
const getBackupDbConnection = (schoolDbName) => {
    const backupDbName = `backup-${schoolDbName}`;

    if (backupDbConnections[backupDbName]) {
        return backupDbConnections[backupDbName];
    }

    if (mongoose.connection.readyState !== 1) {
        throw new Error("Main MongoDB connection is not established.");
    }

    const backupDb = mongoose.connection.useDb(backupDbName, { useCache: true });
    backupDbConnections[backupDbName] = backupDb;
    return backupDb;
};

/**
 * Get the Backup model for a specific school's backup database.
 */
const getBackupModel = (schoolDbName) => {
    const { BackupSchema: backupSchema } = require("@sms/shared");
    const backupDb = getBackupDbConnection(schoolDbName);
    try {
        return backupDb.model("Backup");
    } catch {
        return backupDb.model("Backup", backupSchema);
    }
};

/**
 * Create a backup snapshot of a collection.
 *
 * @param {string} schoolDbName - The school database name
 * @param {string} collectionName - Name of the collection being backed up (e.g., "students", "teachers")
 * @param {Array} data - Array of documents to snapshot
 * @param {Object} options - Additional options
 * @param {string} options.performedBy - User ID who performed the action
 * @param {string} [options.performedByRole] - Role of the user
 * @param {string} [options.operationType] - Type of operation (bulk_insert, bulk_update, etc.)
 * @param {string} [options.description] - Description of the backup
 * @returns {Promise<string>} - The batchId of the created backup
 */
const createBackup = async (schoolDbName, collectionName, data, options = {}) => {
    const Backup = getBackupModel(schoolDbName);
    const batchId = `BKP-${Date.now()}-${uuidv4().substring(0, 8)}`;

    await Backup.create({
        batchId,
        collectionName,
        performedBy: options.performedBy || "system",
        performedByRole: options.performedByRole || "",
        operationType: options.operationType || "manual",
        recordCount: data.length,
        description: options.description || `Backup of ${collectionName} (${data.length} records)`,
        snapshot: data,
    });

    console.log(
        `✅ Backup created: ${batchId} for ${collectionName} in backup-${schoolDbName} (${data.length} records)`
    );

    return batchId;
};

/**
 * Get list of available backups for a collection.
 *
 * @param {string} schoolDbName - The school database name
 * @param {string} collectionName - Name of the collection
 * @param {number} [limit=20] - Max number of backups to return
 * @returns {Promise<Array>} - List of backup metadata (without snapshot data)
 */
const getBackups = async (schoolDbName, collectionName, limit = 20) => {
    const Backup = getBackupModel(schoolDbName);

    const backups = await Backup.find({ collectionName })
        .select("-snapshot") // Exclude large snapshot data from listing
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return backups;
};

/**
 * Restore a collection from a backup snapshot.
 * Creates a safety backup of current data before restoring.
 *
 * @param {string} schoolDbName - The school database name
 * @param {string} collectionName - Name of the collection
 * @param {string} batchId - The batchId to restore from
 * @param {mongoose.Model} CollectionModel - The Mongoose model for the target collection
 * @param {Object} options - Additional options
 * @param {string} options.performedBy - User ID performing the restore
 * @returns {Promise<Object>} - Result with restoredCount and safetyBatchId
 */
const restoreBackup = async (schoolDbName, collectionName, batchId, CollectionModel, options = {}) => {
    const Backup = getBackupModel(schoolDbName);

    // Find the target backup
    const backup = await Backup.findOne({ batchId, collectionName });
    if (!backup) {
        throw new Error(`Backup not found: ${batchId} for collection ${collectionName}`);
    }

    // Create safety snapshot of current data before restoring
    const currentData = await CollectionModel.find().lean();
    const safetyBatchId = await createBackup(schoolDbName, collectionName, currentData, {
        performedBy: options.performedBy || "system",
        operationType: "pre_restore",
        description: `Safety snapshot before restoring from ${batchId}`,
    });

    // Clear current collection and insert snapshot data
    await CollectionModel.deleteMany({});
    if (backup.snapshot && backup.snapshot.length > 0) {
        // Remove _id fields to avoid duplicate key errors
        const cleanData = backup.snapshot.map((doc) => {
            const { _id, ...rest } = typeof doc.toObject === "function" ? doc.toObject() : doc;
            return rest;
        });
        await CollectionModel.insertMany(cleanData, { ordered: false });
    }

    console.log(
        `✅ Restored ${collectionName} from ${batchId} (${backup.snapshot.length} records). Safety backup: ${safetyBatchId}`
    );

    return {
        restoredCount: backup.snapshot.length,
        safetyBatchId,
    };
};

module.exports = {
    getBackupDbConnection,
    getBackupModel,
    createBackup,
    getBackups,
    restoreBackup,
};
