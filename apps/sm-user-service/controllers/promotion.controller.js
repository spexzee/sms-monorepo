const { getSchoolDbConnection } = require("../configs/db");
const {
    SchoolModel: School,
    StudentSchema: studentSchema,
    ClassSchema: classSchema,
    PromotionLogSchema: promotionLogSchema,
} = require("@sms/shared");

/**
 * Get school models helper
 */
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Student: schoolDb.model("Student", studentSchema),
        Class: schoolDb.model("Class", classSchema),
        PromotionLog: schoolDb.model("PromotionLog", promotionLogSchema),
    };
};

/**
 * Get school DB name helper
 */
const getSchoolDbName = async (schoolId) => {
    const school = await School.findOne({ schoolId });
    return school ? school.schoolDbName : null;
};

/**
 * GET /api/school/:schoolId/promotion/preview
 * Returns all active students and active classes to support promotion previews and target class setup.
 */
const previewPromotion = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, Class } = getModels(schoolDbName);
        const students = await Student.find({ schoolId, status: "active" }).select(
            "studentId firstName lastName class section rollNumber academicYear"
        );
        const classes = await Class.find({ schoolId, status: "active" });

        res.status(200).json({
            success: true,
            data: {
                students,
                classes,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/promote-class
 * Promotes students of a single class/section to a target class.
 */
const promoteClass = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            classId,
            sectionId,
            targetClassId,
            targetSectionId,
            newAcademicYear,
            repeaters = [],
            graduates = [],
            notes,
        } = req.body;
        const promotedBy = req.user?.userId || "admin";

        if (!classId || !targetClassId || !newAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "classId, targetClassId, and newAcademicYear are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, PromotionLog } = getModels(schoolDbName);

        // Fetch students in class
        const filter = { schoolId, class: classId, status: "active" };
        if (sectionId) filter.section = sectionId;
        const studentsInClass = await Student.find(filter);

        if (studentsInClass.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active students found in the specified class/section",
            });
        }

        const operations = [];
        const logStudents = [];

        for (const student of studentsInClass) {
            let toClass = targetClassId;
            let toSection = targetSectionId || student.section;
            let status = "promoted";
            let studentStatus = "active";

            if (repeaters.includes(student.studentId)) {
                toClass = student.class;
                toSection = student.section;
                status = "repeated";
            } else if (graduates.includes(student.studentId)) {
                toClass = student.class;
                toSection = student.section;
                status = "graduated";
                studentStatus = "graduated";
            }

            const historyEntry = {
                fromClass: student.class,
                fromSection: student.section,
                toClass,
                toSection,
                academicYear: student.academicYear || "previous",
                promotedAt: new Date(),
                promotedBy,
            };

            operations.push({
                updateOne: {
                    filter: { studentId: student.studentId },
                    update: {
                        $set: {
                            class: toClass,
                            section: toSection,
                            status: studentStatus,
                            academicYear: newAcademicYear,
                        },
                        $push: { promotionHistory: historyEntry },
                    },
                },
            });

            logStudents.push({
                studentId: student.studentId,
                fromClass: student.class,
                fromSection: student.section,
                toClass,
                toSection,
                status,
            });
        }

        await Student.bulkWrite(operations);

        const log = new PromotionLog({
            schoolId,
            academicYear: newAcademicYear,
            promotedBy,
            promotionType: "single_class",
            classId,
            targetClassId,
            students: logStudents,
            rollbackAvailable: true,
            notes,
        });
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully processed promotion for ${logStudents.length} students.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/bulk
 * Bulk promotes students across multiple classes based on class mappings.
 */
const bulkPromote = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { promotions, newAcademicYear, repeaters = [], graduates = [], notes } = req.body;
        const promotedBy = req.user?.userId || "admin";

        if (!promotions || !Array.isArray(promotions) || !newAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "promotions array and newAcademicYear are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, PromotionLog } = getModels(schoolDbName);

        const operations = [];
        const logStudents = [];

        const promoMap = promotions.reduce((acc, p) => {
            acc[p.classId] = p;
            return acc;
        }, {});

        const classIdsToPromote = promotions.map((p) => p.classId);
        const students = await Student.find({
            schoolId,
            class: { $in: classIdsToPromote },
            status: "active",
        });

        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active students found in the specified classes",
            });
        }

        for (const student of students) {
            const promo = promoMap[student.class];
            if (!promo) continue;

            let toClass = promo.targetClassId;
            let toSection = promo.targetSectionId || student.section;
            let status = "promoted";
            let studentStatus = "active";

            if (repeaters.includes(student.studentId)) {
                toClass = student.class;
                toSection = student.section;
                status = "repeated";
            } else if (graduates.includes(student.studentId)) {
                toClass = student.class;
                toSection = student.section;
                status = "graduated";
                studentStatus = "graduated";
            }

            const historyEntry = {
                fromClass: student.class,
                fromSection: student.section,
                toClass,
                toSection,
                academicYear: student.academicYear || "previous",
                promotedAt: new Date(),
                promotedBy,
            };

            operations.push({
                updateOne: {
                    filter: { studentId: student.studentId },
                    update: {
                        $set: {
                            class: toClass,
                            section: toSection,
                            status: studentStatus,
                            academicYear: newAcademicYear,
                        },
                        $push: { promotionHistory: historyEntry },
                    },
                },
            });

            logStudents.push({
                studentId: student.studentId,
                fromClass: student.class,
                fromSection: student.section,
                toClass,
                toSection,
                status,
            });
        }

        if (operations.length > 0) {
            await Student.bulkWrite(operations);
        }

        const log = new PromotionLog({
            schoolId,
            academicYear: newAcademicYear,
            promotedBy,
            promotionType: "bulk",
            students: logStudents,
            rollbackAvailable: true,
            notes,
        });
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully processed bulk promotion for ${logStudents.length} students.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/repeat
 * Marks individual students as repeating.
 */
const markRepeat = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { studentIds, newAcademicYear, notes } = req.body;
        const promotedBy = req.user?.userId || "admin";

        if (!studentIds || !Array.isArray(studentIds) || !newAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "studentIds array and newAcademicYear are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, PromotionLog } = getModels(schoolDbName);
        const students = await Student.find({ schoolId, studentId: { $in: studentIds } });

        const operations = [];
        const logStudents = [];

        for (const student of students) {
            const historyEntry = {
                fromClass: student.class,
                fromSection: student.section,
                toClass: student.class,
                toSection: student.section,
                academicYear: student.academicYear || "previous",
                promotedAt: new Date(),
                promotedBy,
            };

            operations.push({
                updateOne: {
                    filter: { studentId: student.studentId },
                    update: {
                        $set: {
                            academicYear: newAcademicYear,
                        },
                        $push: { promotionHistory: historyEntry },
                    },
                },
            });

            logStudents.push({
                studentId: student.studentId,
                fromClass: student.class,
                fromSection: student.section,
                toClass: student.class,
                toSection: student.section,
                status: "repeated",
            });
        }

        if (operations.length > 0) {
            await Student.bulkWrite(operations);
        }

        const log = new PromotionLog({
            schoolId,
            academicYear: newAcademicYear,
            promotedBy,
            promotionType: "repeat",
            students: logStudents,
            rollbackAvailable: true,
            notes,
        });
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully marked ${logStudents.length} students as repeating.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/graduate
 * Marks individual students as graduated.
 */
const graduateBatch = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { studentIds, newAcademicYear, notes } = req.body;
        const promotedBy = req.user?.userId || "admin";

        if (!studentIds || !Array.isArray(studentIds) || !newAcademicYear) {
            return res.status(400).json({
                success: false,
                message: "studentIds array and newAcademicYear are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, PromotionLog } = getModels(schoolDbName);
        const students = await Student.find({ schoolId, studentId: { $in: studentIds } });

        const operations = [];
        const logStudents = [];

        for (const student of students) {
            const historyEntry = {
                fromClass: student.class,
                fromSection: student.section,
                toClass: student.class,
                toSection: student.section,
                academicYear: student.academicYear || "previous",
                promotedAt: new Date(),
                promotedBy,
            };

            operations.push({
                updateOne: {
                    filter: { studentId: student.studentId },
                    update: {
                        $set: {
                            status: "graduated",
                            academicYear: newAcademicYear,
                        },
                        $push: { promotionHistory: historyEntry },
                    },
                },
            });

            logStudents.push({
                studentId: student.studentId,
                fromClass: student.class,
                fromSection: student.section,
                toClass: student.class,
                toSection: student.section,
                status: "graduated",
            });
        }

        if (operations.length > 0) {
            await Student.bulkWrite(operations);
        }

        const log = new PromotionLog({
            schoolId,
            academicYear: newAcademicYear,
            promotedBy,
            promotionType: "graduate",
            students: logStudents,
            rollbackAvailable: true,
            notes,
        });
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully graduated ${logStudents.length} students.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/archive
 * Sets the active currentAcademicYear on the School document.
 */
const archiveYear = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { newAcademicYear, notes } = req.body;
        const promotedBy = req.user?.userId || "admin";

        if (!newAcademicYear) {
            return res.status(400).json({ success: false, message: "newAcademicYear is required" });
        }

        const school = await School.findOne({ schoolId });
        if (!school) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const schoolDbName = school.schoolDbName;
        const { PromotionLog } = getModels(schoolDbName);

        // Update School collection
        await School.updateOne({ schoolId }, { currentAcademicYear: newAcademicYear });

        const log = new PromotionLog({
            schoolId,
            academicYear: newAcademicYear,
            promotedBy,
            promotionType: "archive",
            students: [],
            rollbackAvailable: false,
            notes: notes || `Academic year updated to ${newAcademicYear}`,
        });
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully archived academic year. School current academic year set to ${newAcademicYear}.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/school/:schoolId/promotion/logs
 * Retrieves promotion history logs for audit trails.
 */
const getPromotionLogs = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { PromotionLog } = getModels(schoolDbName);
        const logs = await PromotionLog.find({ schoolId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/school/:schoolId/promotion/rollback/:logId
 * Reverts promotion class/section changes for the targeted log if within 30 days.
 */
const rollbackPromotion = async (req, res) => {
    try {
        const { schoolId, logId } = req.params;
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({ success: false, message: "School not found" });
        }

        const { Student, PromotionLog } = getModels(schoolDbName);
        const log = await PromotionLog.findById(logId);

        if (!log) {
            return res.status(404).json({ success: false, message: "Promotion log not found" });
        }

        if (log.status === "rolled_back") {
            return res.status(400).json({
                success: false,
                message: "This promotion action has already been rolled back",
            });
        }

        if (!log.rollbackAvailable) {
            return res.status(400).json({
                success: false,
                message: "Rollback is no longer available for this promotion",
            });
        }

        // Limit check
        const limitDate = new Date(log.createdAt);
        limitDate.setDate(limitDate.getDate() + 30);
        if (new Date() > limitDate) {
            log.rollbackAvailable = false;
            await log.save();
            return res.status(400).json({
                success: false,
                message: "Rollback period (30 days) has expired",
            });
        }

        const operations = [];

        for (const item of log.students) {
            operations.push({
                updateOne: {
                    filter: { studentId: item.studentId },
                    update: {
                        $set: {
                            class: item.fromClass,
                            section: item.fromSection,
                            status: "active",
                        },
                        $pull: {
                            promotionHistory: {
                                toClass: item.toClass,
                                academicYear: log.academicYear,
                            },
                        },
                    },
                },
            });
        }

        if (operations.length > 0) {
            await Student.bulkWrite(operations);
        }

        log.status = "rolled_back";
        await log.save();

        res.status(200).json({
            success: true,
            message: `Successfully rolled back promotion for ${log.students.length} students.`,
            data: log,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    previewPromotion,
    promoteClass,
    bulkPromote,
    markRepeat,
    graduateBatch,
    archiveYear,
    getPromotionLogs,
    rollbackPromotion,
};
