require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const { MenuModel } = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_ID = "DEMO101";

async function patchMenus() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");

  console.log(`Adding school ${SCHOOL_ID} to all menus...`);
  
  // Add DEMO101 to the schoolId array for all menus where it's not already present
  const result = await MenuModel.updateMany(
    { schoolId: { $ne: SCHOOL_ID } },
    { $push: { schoolId: SCHOOL_ID } }
  );

  console.log(`Modified ${result.modifiedCount} menus.`);
  console.log("Menus successfully linked to the demo school!");

  process.exit(0);
}

patchMenus().catch(err => {
  console.error(err);
  process.exit(1);
});
