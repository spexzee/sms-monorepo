const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { TimetableConfigSchema: timetableConfigSchema, TeacherSchema: teacherSchema, ClassSchema: classSchema, SubjectSchema: subjectSchema, TimetableAIDraftSchema: timetableAIDraftSchema, TimetableEntrySchema: timetableEntrySchema } = require("@sms/shared");
const TimetableAIService = require("../services/timetable-ai.service");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        TimetableConfig: schoolDb.models.TimetableConfig || schoolDb.model("TimetableConfig", timetableConfigSchema),
        Teacher: schoolDb.models.Teacher || schoolDb.model("Teacher", teacherSchema),
        Class: schoolDb.models.Class || schoolDb.model("Class", classSchema),
        Subject: schoolDb.models.Subject || schoolDb.model("Subject", subjectSchema),
        TimetableAIDraft: schoolDb.models.TimetableAIDraft || schoolDb.model("TimetableAIDraft", timetableAIDraftSchema),
        TimetableEntry: schoolDb.models.TimetableEntry || schoolDb.model("TimetableEntry", timetableEntrySchema),
    };
};

/**
 * Validates the generation rules against school resources (teachers & periods)
 */
const validateAITimetable = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { rules, options } = req.body;

        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({ success: false, message: "Rules array is required" });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableConfig, Teacher, Class, Subject } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(400).json({ success: false, message: "No active timetable configuration found." });
        }

        const teachers = await Teacher.find({ schoolId, status: "active" });
        const classes = await Class.find({ schoolId, status: "active" });
        const subjects = await Subject.find({ schoolId, status: "active" });

        const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, options);

        return res.status(200).json({
            success: true,
            data: validation
        });
    } catch (error) {
        console.error("Error validating AI timetable:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to validate AI timetable constraints"
        });
    }
};

/**
 * Generates an automated draft timetable
 */
const generateAITimetable = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { rules, options } = req.body;

        if (!rules || !Array.isArray(rules)) {
            return res.status(400).json({ success: false, message: "Rules array is required" });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableConfig, Teacher, Class, Subject, TimetableAIDraft } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(400).json({ success: false, message: "No active timetable configuration found." });
        }

        const teachers = await Teacher.find({ schoolId, status: "active" });
        const classes = await Class.find({ schoolId, status: "active" });
        const subjects = await Subject.find({ schoolId, status: "active" });

        // Run pre-validation
        const validation = TimetableAIService.validateConstraints(config, classes, teachers, rules, subjects, options);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "Cannot generate timetable due to constraint violations.",
                errors: validation.errors
            });
        }

        // Generate the draft schedule array
        const schedule = TimetableAIService.generateTimetable(config, classes, teachers, subjects, rules, options);

        // Save to TimetableAIDraft collection with versioning
        const lastDraft = await TimetableAIDraft.findOne({ schoolId }).sort({ version: -1 });
        const newVersion = lastDraft && lastDraft.version ? lastDraft.version + 1 : 1;

        // Archive existing drafts
        await TimetableAIDraft.updateMany({ schoolId, status: "draft" }, { $set: { status: "archived" } });

        // Drop the old unique index on schoolId if it exists to allow migration to compound index
        try {
            await TimetableAIDraft.collection.dropIndex('schoolId_1');
        } catch (error) {
            // Ignore if index doesn't exist
        }

        const draft = await TimetableAIDraft.create({
            schoolId,
            status: "draft",
            version: newVersion,
            rules,
            entries: schedule
        });

        return res.status(200).json({
            success: true,
            data: draft,
            message: `Successfully generated and saved ${schedule.length} timetable draft entries.`
        });
    } catch (error) {
        console.error("Error generating AI timetable:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate AI timetable"
        });
    }
};

/**
 * Gets a specific AI draft for the school (either the active 'draft' or a specific version)
 */
const getAIDraft = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { version } = req.query;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        let query = { schoolId };
        if (version) {
            query.version = parseInt(version, 10);
        } else {
            query.status = "draft";
        }

        const draft = await TimetableAIDraft.findOne(query);

        return res.status(200).json({
            success: true,
            data: draft
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Lists all available AI draft versions for the school
 */
const getAIDraftVersions = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const versions = await TimetableAIDraft.find({ schoolId })
            .select("version status createdAt")
            .sort({ version: -1 });

        return res.status(200).json({
            success: true,
            data: versions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Deletes a specific draft version
 */
const deleteAIDraftVersion = async (req, res) => {
    try {
        const { schoolId, version } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        await TimetableAIDraft.deleteOne({ schoolId, version: parseInt(version, 10) });

        return res.status(200).json({
            success: true,
            message: `Draft version ${version} deleted successfully.`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Publishes the AI draft to the live timetable
 */
const publishAIDraft = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft, TimetableEntry } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft || !draft.entries || draft.entries.length === 0) {
            return res.status(400).json({ success: false, message: "No active draft found to publish." });
        }

        // Clear existing entries for the classes being published
        const classSections = [...new Set(draft.entries.map(e => `${e.classId}-${e.sectionId}`))];
        const deleteConditions = classSections.map(cs => {
            const [classId, sectionId] = cs.split('-');
            return { schoolId, classId, sectionId };
        });
        if (deleteConditions.length > 0) {
            await TimetableEntry.deleteMany({ $or: deleteConditions });
        }

        const inserted = await TimetableEntry.insertMany(
            draft.entries.map(e => ({
                schoolId,
                classId: e.classId,
                sectionId: e.sectionId,
                subjectId: e.subjectId,
                teacherId: e.teacherId,
                dayOfWeek: e.dayOfWeek,
                periodNumber: e.periodNumber,
                entryId: `AI_GEN_${new Date().getTime()}_${Math.random().toString(36).substring(7)}`,
                type: 'regular'
            }))
        );

        // Mark draft as published
        draft.status = "published";
        await draft.save();

        return res.status(200).json({
            success: true,
            message: `Successfully published ${inserted.length} entries to live timetable.`
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Updates or adds a single entry in the draft
 */
const updateAIDraftEntry = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId, sectionId, dayOfWeek, periodNumber, subjectId, teacherId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

        // Find existing index
        const index = draft.entries.findIndex(e =>
            e.classId === classId &&
            e.sectionId === sectionId &&
            e.dayOfWeek === dayOfWeek &&
            e.periodNumber === periodNumber
        );

        if (index > -1) {
            draft.entries[index].subjectId = subjectId;
            draft.entries[index].teacherId = teacherId;
        } else {
            draft.entries.push({ classId, sectionId, dayOfWeek, periodNumber, subjectId, teacherId });
        }

        await draft.save();
        return res.status(200).json({ success: true, message: "Draft entry updated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Deletes a single entry from the draft
 */
const deleteAIDraftEntry = async (req, res) => {
    try {
        const { schoolId, classId, sectionId, dayOfWeek, periodNumber } = req.params;
        const periodNum = parseInt(periodNumber, 10);

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableAIDraft } = models;

        const draft = await TimetableAIDraft.findOne({ schoolId, status: "draft" });
        if (!draft) return res.status(404).json({ success: false, message: "Draft not found" });

        draft.entries = draft.entries.filter(e =>
            !(e.classId === classId && e.sectionId === sectionId && e.dayOfWeek === dayOfWeek && e.periodNumber === periodNum)
        );

        await draft.save();
        return res.status(200).json({ success: true, message: "Draft entry deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    validateAITimetable,
    generateAITimetable,
    getAIDraft,
    publishAIDraft,
    updateAIDraftEntry,
    deleteAIDraftEntry,
    getAIDraftVersions,
    deleteAIDraftVersion
};
