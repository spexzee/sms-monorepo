const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  EmailRegistryModel: EmailRegistry,
  TeacherSchema: teacherSchema,
} = require("@sms/shared");
const {
  getPaginationParams,
  formatPaginationResponse,
} = require("../utils/pagination");

/**
 * Get Teacher model for a specific school database
 */
const getTeacherModel = (schoolDbName) => {
  const schoolDb = getSchoolDbConnection(schoolDbName);
  return schoolDb.model("Teacher", teacherSchema);
};

/**
 * Helper function to generate teacherId
 * Format: TCH + 5 digit number (TCH00001, TCH00002, ...)
 */
const generateTeacherId = async (Teacher) => {
  const lastTeacher = await Teacher.findOne().sort({ teacherId: -1 });

  if (!lastTeacher || !lastTeacher.teacherId) {
    return "TCH00001";
  }

  const lastIdNumber = parseInt(lastTeacher.teacherId.replace("TCH", ""), 10);
  const newIdNumber = lastIdNumber + 1;

  return `TCH${String(newIdNumber).padStart(5, "0")}`;
};

/**
 * Get school database name by schoolId
 */
const getSchoolDbName = async (schoolId) => {
  const school = await School.findOne({ schoolId });
  if (!school) {
    return null;
  }
  return school.schoolDbName;
};

// Create a new teacher
const createTeacher = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      department,
      subjects,
      classes,
      status,
      profileImage,
      classTeacherSectionId,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, email, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in EmailRegistry (global check)
    const existingEmail = await EmailRegistry.findOne({
      email: normalizedEmail,
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in the system",
      });
    }

    // Get school database name
    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Generate teacherId
    const teacherId = await generateTeacherId(Teacher);

    const newTeacher = new Teacher({
      teacherId,
      schoolId,
      firstName,
      lastName,
      email: normalizedEmail,
      password, // Plain text for now - add bcrypt later
      phone,
      department,
      subjects: subjects || [],
      classes: classes || [],
      status: status || "active",
      profileImage,
      classTeacherSectionId: classTeacherSectionId || null,
    });

    const savedTeacher = await newTeacher.save();

    // Register in EmailRegistry for unified login
    await EmailRegistry.create({
      email: normalizedEmail,
      role: "teacher",
      schoolId: schoolId,
      userId: savedTeacher.teacherId,
      status: savedTeacher.status || "active",
    });

    // If assigned as class teacher, update the Class model
    if (classTeacherSectionId && classTeacherSectionId.includes("#")) {
      const [assignedClassId, assignedSectionId] =
        classTeacherSectionId.split("#");
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      await Class.findOneAndUpdate(
        { classId: assignedClassId, "sections.sectionId": assignedSectionId },
        { $set: { "sections.$.classTeacherId": savedTeacher.teacherId } },
      );
    }

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: {
        teacherId: savedTeacher.teacherId,
        schoolId: savedTeacher.schoolId,
        firstName: savedTeacher.firstName,
        lastName: savedTeacher.lastName,
        email: savedTeacher.email,
        phone: savedTeacher.phone,
        department: savedTeacher.department,
        subjects: savedTeacher.subjects,
        classes: savedTeacher.classes,
        status: savedTeacher.status,
        classTeacherSectionId: savedTeacher.classTeacherSectionId,
      },
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating teacher",
      error: error.message,
    });
  }
};

// Get teacher by teacherId (with aggregated details)
const getTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);
    const teacher = await Teacher.findOne({ teacherId }).select("-password");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Convert to object to add additional fields
    const teacherObj = teacher.toObject();

    // Fetch school details for schoolName
    const school = await School.findOne({ schoolId });
    if (school) {
      teacherObj.schoolName = school.schoolName;
    }

    // Fetch subject details for subjectNames
    if (teacher.subjects && teacher.subjects.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { SubjectSchema: subjectSchema } = require("@sms/shared");
      const Subject = schoolDb.model("Subject", subjectSchema);

      const subjects = await Subject.find({
        subjectId: { $in: teacher.subjects },
      }).select("subjectId name");

      teacherObj.subjectNames = subjects.map((s) => s.name);
    }

    // Fetch class details for classNames
    if (teacher.classes && teacher.classes.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      const uniqueClassIds = [
        ...new Set(teacher.classes.map((c) => c.split("#")[0])),
      ];
      const classesDocs = await Class.find({
        classId: { $in: uniqueClassIds },
      }).select("classId name sections");

      teacherObj.classNames = teacher.classes.map((c) => {
        if (c.includes("#")) {
          const [cId, sId] = c.split("#");
          const classDoc = classesDocs.find((cls) => cls.classId === cId);
          if (classDoc) {
            const section = classDoc.sections.find((s) => s.sectionId === sId);
            return section
              ? `${classDoc.name} - ${section.name}`
              : classDoc.name;
          }
        }
        return c;
      });
    }

    // Fetch class teacher label if applicable
    if (
      teacher.classTeacherSectionId &&
      teacher.classTeacherSectionId.includes("#")
    ) {
      const [assignedClassId, assignedSectionId] =
        teacher.classTeacherSectionId.split("#");
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      const classDoc = await Class.findOne({
        classId: assignedClassId,
        "sections.sectionId": assignedSectionId,
      }).select("name sections");

      if (classDoc) {
        const section = classDoc.sections.find(
          (s) => s.sectionId === assignedSectionId,
        );
        if (section) {
          teacherObj.classTeacherLabel = `${classDoc.name} - ${section.name}`;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Teacher fetched successfully",
      data: teacherObj,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching teacher",
      error: error.message,
    });
  }
};

// Get all teachers in a school
const getAllTeachers = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { department, status } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Build query filters
    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;

    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Teacher.countDocuments(query),
    ]);

    // Populate class teacher labels
    const classSectionPairs = teachers
      .filter(
        (t) => t.classTeacherSectionId && t.classTeacherSectionId.includes("#"),
      )
      .map((t) => t.classTeacherSectionId);

    const sectionMap = {};
    if (classSectionPairs.length > 0) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      // Get unique classIds to optimize query
      const uniqueClassIds = [
        ...new Set(classSectionPairs.map((p) => p.split("#")[0])),
      ];

      const classesDocs = await Class.find({
        classId: { $in: uniqueClassIds },
      }).select("classId name sections");

      classSectionPairs.forEach((pair) => {
        const [cId, sId] = pair.split("#");
        const classDoc = classesDocs.find((c) => c.classId === cId);
        if (classDoc) {
          const section = classDoc.sections.find((s) => s.sectionId === sId);
          if (section) {
            sectionMap[pair] = `${classDoc.name} - ${section.name}`;
          }
        }
      });
    }

    const teachersWithLabels = teachers.map((t) => {
      const obj = t.toObject();
      obj.classTeacherLabel = sectionMap[t.classTeacherSectionId] || null;
      return obj;
    });

    const response = formatPaginationResponse(
      teachersWithLabels,
      total,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      message: "Teachers fetched successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching teachers",
      error: error.message,
    });
  }
};

// Update teacher by teacherId
const updateTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;
    const updateData = req.body;

    // Prevent updating teacherId, schoolId, and role
    delete updateData.teacherId;
    delete updateData.schoolId;
    delete updateData.role;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    // Get current teacher for email comparison
    const currentTeacher = await Teacher.findOne({ teacherId });
    if (!currentTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // If email is being updated, update EmailRegistry too
    if (updateData.email && updateData.email !== currentTeacher.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();

      // Check if new email exists
      const existingEmail = await EmailRegistry.findOne({
        email: normalizedEmail,
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists in the system",
        });
      }

      // Update EmailRegistry
      await EmailRegistry.findOneAndUpdate(
        { email: currentTeacher.email.toLowerCase() },
        { email: normalizedEmail },
      );

      updateData.email = normalizedEmail;
    }
    // If status is being updated, update EmailRegistry too
    if (updateData.status) {
      await EmailRegistry.findOneAndUpdate(
        { email: currentTeacher.email.toLowerCase() },
        { status: updateData.status },
      );
    }

    // If classTeacherSectionId is being updated
    if (
      updateData.classTeacherSectionId !== undefined &&
      updateData.classTeacherSectionId !== currentTeacher.classTeacherSectionId
    ) {
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      // 1. Clear previous section if any
      if (
        currentTeacher.classTeacherSectionId &&
        currentTeacher.classTeacherSectionId.includes("#")
      ) {
        const [oldClassId, oldSectionId] =
          currentTeacher.classTeacherSectionId.split("#");
        await Class.findOneAndUpdate(
          { classId: oldClassId, "sections.sectionId": oldSectionId },
          { $set: { "sections.$.classTeacherId": null } },
        );
      }

      // 2. Set new section if any
      if (
        updateData.classTeacherSectionId &&
        updateData.classTeacherSectionId.includes("#")
      ) {
        const [newClassId, newSectionId] =
          updateData.classTeacherSectionId.split("#");
        await Class.findOneAndUpdate(
          { classId: newClassId, "sections.sectionId": newSectionId },
          { $set: { "sections.$.classTeacherId": currentTeacher.teacherId } },
        );
      }
    }

    const updatedTeacher = await Teacher.findOneAndUpdate(
      { teacherId },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating teacher",
      error: error.message,
    });
  }
};

// Delete teacher by teacherId (soft delete - set status to inactive)
const deleteTeacherById = async (req, res) => {
  try {
    const { schoolId, id: teacherId } = req.params;

    const schoolDbName = await getSchoolDbName(schoolId);
    if (!schoolDbName) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    const Teacher = getTeacherModel(schoolDbName);

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Soft delete
    const deletedTeacher = await Teacher.findOneAndUpdate(
      { teacherId },
      { status: "inactive" },
      { new: true },
    ).select("-password");

    // Update EmailRegistry status
    await EmailRegistry.findOneAndUpdate(
      { email: teacher.email.toLowerCase() },
      { status: "inactive" },
    );

    // If teacher was a class teacher, clear the reference in Class model
    if (
      teacher.classTeacherSectionId &&
      teacher.classTeacherSectionId.includes("#")
    ) {
      const [assignedClassId, assignedSectionId] =
        teacher.classTeacherSectionId.split("#");
      const schoolDb = getSchoolDbConnection(schoolDbName);
      const { ClassSchema: classSchema } = require("@sms/shared");
      const Class = schoolDb.model("Class", classSchema);

      await Class.findOneAndUpdate(
        { classId: assignedClassId, "sections.sectionId": assignedSectionId },
        { $set: { "sections.$.classTeacherId": null } },
      );
    }

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully (soft delete)",
      data: deletedTeacher,
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting teacher",
      error: error.message,
    });
  }
};

module.exports = {
  createTeacher,
  getTeacherById,
  getAllTeachers,
  updateTeacherById,
  deleteTeacherById,
};
