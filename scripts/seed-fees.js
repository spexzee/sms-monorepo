require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const { ClassSchema } = require("../packages/shared/models");
const FeeCategorySchema = require("../packages/shared/models/fee-category.model");
const FeeStructureSchema = require("../packages/shared/models/fee-structure.model");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function seedFees() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });

  const Class = schoolDb.model("Class", ClassSchema);
  const FeeCategory = schoolDb.model("FeeCategory", FeeCategorySchema);
  const FeeStructure = schoolDb.model("FeeStructure", FeeStructureSchema);

  // 1. Seed Fee Categories
  await FeeCategory.deleteMany({});
  
  const categories = [
    {
      feeCategoryId: generateId("FC"),
      schoolId: SCHOOL_ID,
      name: "Tuition Fee",
      description: "Basic academic tuition fee",
      categoryType: "academic",
      isRecurring: true,
      isMandatory: true,
      createdBy: "ADMIN",
    },
    {
      feeCategoryId: generateId("FC"),
      schoolId: SCHOOL_ID,
      name: "Examination Fee",
      description: "Term-wise exam fee",
      categoryType: "exam",
      isRecurring: false,
      isMandatory: true,
      createdBy: "ADMIN",
    },
    {
      feeCategoryId: generateId("FC"),
      schoolId: SCHOOL_ID,
      name: "Computer Lab Fee",
      description: "Lab usage and maintenance",
      categoryType: "technology",
      isRecurring: false,
      isMandatory: true,
      createdBy: "ADMIN",
    },
    {
      feeCategoryId: generateId("FC"),
      schoolId: SCHOOL_ID,
      name: "Transport Fee",
      description: "Bus facility fee",
      categoryType: "transport",
      isRecurring: true,
      isMandatory: false,
      createdBy: "ADMIN",
    }
  ];

  const insertedCategories = await FeeCategory.insertMany(categories);
  console.log(`Seeded ${insertedCategories.length} Fee Categories`);

  // Map for easy access
  const catMap = {
    Tuition: insertedCategories.find(c => c.name === "Tuition Fee"),
    Exam: insertedCategories.find(c => c.name === "Examination Fee"),
    Lab: insertedCategories.find(c => c.name === "Computer Lab Fee"),
    Transport: insertedCategories.find(c => c.name === "Transport Fee"),
  };

  // 2. Seed Fee Structures for each Class
  await FeeStructure.deleteMany({});
  
  const classes = await Class.find({ status: 'active' });

  const structuresToInsert = [];

  for (const c of classes) {
    // Determine base price based on class number (extract number from name like "Class 1")
    const classNumMatch = c.name.match(/\d+/);
    const classNum = classNumMatch ? parseInt(classNumMatch[0]) : 1;

    // Price scaling: Base 10,000 + 2000 per class level
    const tuitionAmount = 10000 + (classNum * 2000);
    const examAmount = 1000 + (classNum * 100);
    const labAmount = classNum > 5 ? 1500 : 500; // Lab fee higher for senior classes

    const feeItems = [
      {
        feeCategoryId: catMap.Tuition.feeCategoryId,
        categoryName: catMap.Tuition.name,
        categoryType: catMap.Tuition.categoryType,
        amount: tuitionAmount,
        frequency: "monthly",
        dueDayOfMonth: 10,
        isOptional: false,
        displayOrder: 1
      },
      {
        feeCategoryId: catMap.Exam.feeCategoryId,
        categoryName: catMap.Exam.name,
        categoryType: catMap.Exam.categoryType,
        amount: examAmount,
        frequency: "half_yearly",
        dueDayOfMonth: 15,
        isOptional: false,
        displayOrder: 2
      },
      {
        feeCategoryId: catMap.Lab.feeCategoryId,
        categoryName: catMap.Lab.name,
        categoryType: catMap.Lab.categoryType,
        amount: labAmount,
        frequency: "annually",
        dueDayOfMonth: 20,
        isOptional: false,
        displayOrder: 3
      },
      {
        feeCategoryId: catMap.Transport.feeCategoryId,
        categoryName: catMap.Transport.name,
        categoryType: catMap.Transport.categoryType,
        amount: 1500, // Flat fee for transport, but it's optional
        frequency: "monthly",
        dueDayOfMonth: 10,
        isOptional: true,
        displayOrder: 4
      }
    ];

    structuresToInsert.push({
      feeStructureId: generateId("FS"),
      schoolId: SCHOOL_ID,
      name: `${c.name} - Academic Year 2026-27`,
      description: `Complete fee structure for ${c.name} students.`,
      academicYear: "2026-2027",
      applicableClasses: [c.classId],
      feeItems: feeItems,
      installmentEnabled: true,
      installments: [
        { installmentNumber: 1, label: "Term 1", dueDate: new Date("2026-06-10"), percentageOfTotal: 50 },
        { installmentNumber: 2, label: "Term 2", dueDate: new Date("2026-11-10"), percentageOfTotal: 50 }
      ],
      lateFeeEnabled: true,
      lateFeeRule: {
        gracePeriodDays: 5,
        lateFeeType: "flat",
        lateFeeValue: 50,
        lateFeeFrequency: "daily",
        maxLateFeeAmount: 1000
      },
      status: "published",
      createdBy: "ADMIN",
      publishedAt: new Date()
    });
  }

  const insertedStructures = await FeeStructure.insertMany(structuresToInsert);
  console.log(`Seeded ${insertedStructures.length} Fee Structures, one for each class with scaled pricing!`);

  console.log("Done!");
  process.exit(0);
}

seedFees().catch(err => {
  console.error(err);
  process.exit(1);
});
