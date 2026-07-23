require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const { UserModel } = require("../packages/shared/models");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_ID = "DEMO101";

// Helper function to generate IDs
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function addAdmin() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to SuperAdmin DB");

  // Clear any existing school admins for this school
  await UserModel.deleteMany({ schoolId: SCHOOL_ID });

  // Create school admin
  console.log("Creating School Admin...");
  const admin = await UserModel.create({
    userId: generateId("USR"),
    username: "schooladmin",
    email: "schooladmin@demoschool.com",
    password: "password123", // Using plain text since auth service might be checking plain text
    role: "sch_admin",
    schoolId: SCHOOL_ID,
    contactNumber: "+919876543210",
    status: "active"
  });

  console.log("School Admin Created Successfully!");
  console.log(`Email: ${admin.email}`);
  console.log(`Password: password123`);
  
  process.exit(0);
}

addAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
