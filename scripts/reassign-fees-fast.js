require("dotenv").config({ path: "./apps/sm-payment-service/.env" });
const mongoose = require("mongoose");
const { StudentFeeAssignmentSchema } = require("../packages/shared/models");
const StudentFeeAccountService = require("../apps/sm-payment-service/services/studentFeeAccount.service");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const SCHOOL_DB_NAME = "school-db-demo";

async function doReassign() {
  const mainConnection = await mongoose.connect(MONGO_URI);
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });
  
  const StudentFeeAssignment = schoolDb.model("StudentFeeAssignment", StudentFeeAssignmentSchema.clone());
  const FeeStructure = schoolDb.model("FeeStructure", require("../packages/shared/models/fee-structure.model"));
  
  console.log("Wiping existing Student Fee Ledgers...");
  await StudentFeeAssignment.deleteMany({});
  console.log("Wiped all fee ledgers.");

  const structures = await FeeStructure.find({ status: "published" });
  console.log(`Found ${structures.length} published fee structures. Assigning them...`);

  const actor = { userId: "USR-55C28DEB", name: "System Admin" };

  for (const structure of structures) {
      console.log(`Assigning structure: ${structure.name}`);
      try {
          const result = await StudentFeeAccountService.assignStructure("DEMO101", structure.feeStructureId, { academicYear: structure.academicYear }, actor);
          console.log(` -> Created ${result.createdCount} ledgers, skipped ${result.skippedCount}`);
      } catch (err) {
          console.error(` -> Error assigning structure:`, err.message);
      }
  }

  console.log("Finished assigning all fee structures.");
  process.exit(0);
}

doReassign().catch(err => {
  console.error(err);
  process.exit(1);
});
