require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const { TeacherSchema, ClassSchema } = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";

async function patchTeacherClasses() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");

  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  console.log(`Connected to School DB: ${SCHOOL_DB_NAME}`);

  const Teacher = schoolDb.model("Teacher", TeacherSchema);
  const Class = schoolDb.model("Class", ClassSchema);

  const classes = await Class.find({});
  const classIds = classes.map(c => c.classId);
  const teachers = await Teacher.find({});

  console.log(`Assigning classes to ${teachers.length} teachers...`);

  for (const teacher of teachers) {
    let assignedClassSectionPairs = [];
    
    // Primary assignment if they are a class teacher
    if (teacher.classTeacherSectionId) {
      const primaryClass = classes.find(c => 
        c.sections.some(s => s.sectionId === teacher.classTeacherSectionId)
      );
      if (primaryClass) {
        assignedClassSectionPairs.push(`${primaryClass.classId}#${teacher.classTeacherSectionId}`);
      }
    }

    // Assign 2 more random sections to make it realistic
    while (assignedClassSectionPairs.length < 3) {
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      if (randomClass.sections && randomClass.sections.length > 0) {
          const randomSection = randomClass.sections[Math.floor(Math.random() * randomClass.sections.length)];
          const pair = `${randomClass.classId}#${randomSection.sectionId}`;
          if (!assignedClassSectionPairs.includes(pair)) {
            assignedClassSectionPairs.push(pair);
          }
      }
    }

    teacher.classes = assignedClassSectionPairs;
    await teacher.save();
  }

  console.log("Teachers successfully updated with assigned classes!");
  process.exit(0);
}

patchTeacherClasses().catch(err => {
  console.error(err);
  process.exit(1);
});
