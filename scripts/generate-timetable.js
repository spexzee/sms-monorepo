require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const {
  TimetableConfigSchema,
  TimetableEntrySchema,
  ClassSchema,
  TeacherSchema,
  SubjectSchema,
} = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function generateTimetable() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");

  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, {
    useCache: true,
  });

  const TimetableConfig = schoolDb.model(
    "TimetableConfig",
    TimetableConfigSchema
  );
  const TimetableEntry = schoolDb.model(
    "TimetableEntry",
    TimetableEntrySchema
  );
  const Class = schoolDb.model("Class", ClassSchema);
  const Teacher = schoolDb.model("Teacher", TeacherSchema);
  const Subject = schoolDb.model("Subject", SubjectSchema);

  // 1. Get configuration
  const config = await TimetableConfig.findOne({ status: "active" });
  if (!config) {
    console.error("No active timetable config found.");
    process.exit(1);
  }

  const { workingDays, periods } = config;
  const regularPeriods = periods.filter((p) => p.type === "regular" || p.type === "lab" || p.type === "pt");

  // 2. Get data
  const classes = await Class.find({ status: "active" });
  const teachers = await Teacher.find({ status: "active" });

  console.log("Clearing existing timetable entries...");
  await TimetableEntry.deleteMany({});

  const newEntries = [];
  // Keep track of teacher schedule to avoid conflicts
  // busyTeachers[teacherId][day][periodNumber] = true
  const busyTeachers = {};

  teachers.forEach((t) => {
    busyTeachers[t.teacherId] = {};
    workingDays.forEach((day) => {
      busyTeachers[t.teacherId][day] = {};
    });
  });

  // Assign periods
  for (const classDoc of classes) {
    for (const section of classDoc.sections) {
      // Find teachers assigned to this class and section
      const classSectionPair = `${classDoc.classId}#${section.sectionId}`;
      const eligibleTeachers = teachers.filter((t) =>
        t.classes.includes(classSectionPair)
      );
      const fallbackTeachers = teachers.filter((t) =>
        t.classes.some((c) => c.startsWith(`${classDoc.classId}#`))
      );

      for (const day of workingDays) {
        for (const period of regularPeriods) {
          let selectedTeacher = null;
          
          // Try eligible -> fallback -> all
          const poolsToTry = [eligibleTeachers, fallbackTeachers, teachers];
          
          for (const pool of poolsToTry) {
             const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
             for (const t of shuffledPool) {
                if (!busyTeachers[t.teacherId][day][period.periodNumber]) {
                  selectedTeacher = t;
                  break;
                }
             }
             if (selectedTeacher) break; // Found one!
          }

          if (selectedTeacher) {
            // Mark teacher as busy
            busyTeachers[selectedTeacher.teacherId][day][period.periodNumber] = true;

            // Pick a random subject this teacher teaches
            const subjectId =
              selectedTeacher.subjects && selectedTeacher.subjects.length > 0
                ? selectedTeacher.subjects[
                    Math.floor(Math.random() * selectedTeacher.subjects.length)
                  ]
                : "SUB-GEN";

            newEntries.push({
              entryId: generateId("TTE"),
              schoolId: SCHOOL_ID,
              classId: classDoc.classId,
              sectionId: section.sectionId,
              subjectId: subjectId,
              teacherId: selectedTeacher.teacherId,
              dayOfWeek: day,
              periodNumber: period.periodNumber,
              periodType: period.type,
              isActive: true,
              status: "active",
            });
          }
        }
      }
    }
  }

  console.log(`Generating ${newEntries.length} non-conflicting timetable entries...`);
  await TimetableEntry.insertMany(newEntries);

  console.log("Timetable successfully generated!");
  process.exit(0);
}

generateTimetable().catch((err) => {
  console.error(err);
  process.exit(1);
});
