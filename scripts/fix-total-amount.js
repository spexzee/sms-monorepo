require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const FeeStructureSchema = require("../packages/shared/models/fee-structure.model");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";

async function fixTotalAmounts() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });

  const FeeStructure = schoolDb.model("FeeStructure", FeeStructureSchema);

  const structures = await FeeStructure.find({});
  let updatedCount = 0;

  for (const structure of structures) {
      if (structure.feeItems && structure.feeItems.length > 0) {
          const totalAmount = structure.feeItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          
          if (structure.totalFeeAmount !== totalAmount) {
              await FeeStructure.updateOne({ _id: structure._id }, { totalFeeAmount: totalAmount });
              updatedCount++;
          }
      }
  }

  console.log(`Updated totalFeeAmount for ${updatedCount} Fee Structures!`);
  process.exit(0);
}

fixTotalAmounts().catch(err => {
  console.error(err);
  process.exit(1);
});
