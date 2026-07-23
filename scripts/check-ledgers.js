require("dotenv").config({ path: "./apps/sm-payment-service/.env" });
const mongoose = require("mongoose");
const { StudentFeeAssignmentSchema } = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const SCHOOL_DB_NAME = "school-db-demo";

async function checkLedgers() {
  const mainConnection = await mongoose.connect(MONGO_URI);
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  
  const StudentFeeAssignment = schoolDb.model("StudentFeeAssignment", StudentFeeAssignmentSchema.clone());
  
  const ledgers = await StudentFeeAssignment.find({ academicYear: "2026-2027" });
  console.log(`Found ${ledgers.length} ledgers for 2026-2027`);
  
  if (ledgers.length > 0) {
      console.log(`First ledger studentId: ${ledgers[0].studentId}, feeStructureId: ${ledgers[0].feeStructureId}`);
  }
  process.exit(0);
}

checkLedgers().catch(err => {
  console.error(err);
  process.exit(1);
});
