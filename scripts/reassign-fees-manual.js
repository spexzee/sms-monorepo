require("dotenv").config({ path: "./apps/sm-payment-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const { StudentFeeAssignmentSchema, StudentSchema, ClassSchema } = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function doReassign() {
  const mainConnection = await mongoose.connect(MONGO_URI);
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  
  const StudentFeeAssignment = schoolDb.model("StudentFeeAssignment", StudentFeeAssignmentSchema.clone());
  const FeeStructure = schoolDb.model("FeeStructure", require("../packages/shared/models/fee-structure.model"));
  
  // Need Student model to get students
  let Student;
  try { Student = schoolDb.model("Student"); } catch { Student = schoolDb.model("Student", StudentSchema); }
  
  let Class;
  try { Class = schoolDb.model("Class"); } catch { Class = schoolDb.model("Class", ClassSchema); }
  
  console.log("Wiping existing Student Fee Ledgers...");
  await StudentFeeAssignment.deleteMany({});
  console.log("Wiped all fee ledgers.");

  const structures = await FeeStructure.find({ status: "published" });
  console.log(`Found ${structures.length} published fee structures. Assigning them...`);

  const classes = await Class.find({ schoolId: SCHOOL_ID }).lean();
  
  const getClassName = (cid) => {
      const cls = classes.find(c => c.classId === cid);
      return cls ? cls.name : cid;
  };

  for (const structure of structures) {
      console.log(`Assigning structure: ${structure.name}`);
      
      const students = await Student.find({ schoolId: SCHOOL_ID, status: "active", class: { $in: structure.applicableClasses } }).lean();
      
      if (students.length === 0) {
          console.log(` -> No students found in classes: ${structure.applicableClasses.join(', ')}`);
          continue;
      }
      
      const newLedgers = [];
      const startYear = Number(structure.academicYear.split("-")[0]);
      
      for (const student of students) {
          const feeBreakdown = structure.feeItems.map((item) => {
              const dueMonth = 4;
              const dueDate = new Date(Date.UTC(startYear, dueMonth, item.dueDayOfMonth || 10));
              return {
                  feeCategoryId: item.feeCategoryId,
                  categoryName: item.categoryName,
                  categoryType: item.categoryType,
                  originalAmount: item.amount,
                  adjustments: 0,
                  discountAmount: 0,
                  waivedAmount: 0,
                  netAmount: item.amount,
                  paidAmount: 0,
                  refundedAmount: 0,
                  lateFeeCharged: 0,
                  balanceAmount: item.amount,
                  dueDate,
                  status: 'unpaid'
              };
          });

          const installmentSchedule = structure.installmentEnabled
              ? structure.installments.map((inst) => {
                    const totalAmount = Math.round(((structure.totalFeeAmount * inst.percentageOfTotal) / 100) * 100) / 100;
                    return {
                        installmentNumber: inst.installmentNumber,
                        label: inst.label,
                        dueDate: inst.dueDate,
                        totalAmount,
                        paidAmount: 0,
                        balanceAmount: totalAmount,
                        lateFeeApplied: 0,
                        status: 'pending'
                    };
                })
              : [];

          const totalOriginalFees = structure.totalFeeAmount;
          
          newLedgers.push({
              assignmentId: generateId('FEE'),
              schoolId: SCHOOL_ID,
              studentId: student.studentId,
              studentName: `${student.firstName} ${student.lastName}`.trim(),
              classId: student.class,
              className: getClassName(student.class),
              sectionId: student.section || '',
              sectionName: '', // simplification
              rollNumber: student.rollNumber || '',
              academicYear: structure.academicYear,
              feeStructureId: structure.feeStructureId,
              feeStructureName: structure.name,
              feeBreakdown,
              installmentSchedule,
              totalOriginalFees,
              totalAdjustments: 0,
              totalDiscount: 0,
              totalWaived: 0,
              netFees: totalOriginalFees,
              totalPaid: 0,
              totalRefunded: 0,
              totalLateFee: 0,
              totalBalance: totalOriginalFees,
              accountStatus: 'active',
              isProRata: false,
              createdBy: 'system',
              createdByName: 'System Admin'
          });
      }
      
      await StudentFeeAssignment.insertMany(newLedgers);
      console.log(` -> Created ${newLedgers.length} ledgers`);
  }

  console.log("Finished assigning all fee structures.");
  process.exit(0);
}

doReassign().catch(err => {
  console.error(err);
  process.exit(1);
});
