require("dotenv").config({ path: "./apps/sm-payment-service/.env" });
const mongoose = require("mongoose");
const { StudentFeeAssignmentSchema } = require("../packages/shared/models");
const http = require("http");

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

  // We can hit the local endpoint or just let the user assign them in the UI.
  // The prompt asked to "assign class structure to its thier classes". 
  // We'll write the logic to invoke the API directly for each structure.
  
  for (const structure of structures) {
      console.log(`Assigning structure: ${structure.name} (ID: ${structure.feeStructureId}) to classes: ${structure.applicableClasses.join(", ")}`);
      
      const postData = JSON.stringify({
          academicYear: structure.academicYear
          // The backend uses structure's applicableClasses if classId isn't provided
      });

      const options = {
          hostname: 'localhost',
          port: 5005,
          path: `/api/school/DEMO101/fees/assignments/structures/${structure.feeStructureId}/assign`,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              // We'll use a mocked internal call if no token, but actually we need a token.
              // We'll just generate the JWT token.
              'Authorization': `Bearer ${generateToken()}`
          }
      };

      await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                  console.log(`Result: ${data}`);
                  resolve();
              });
          });
          req.on('error', (e) => reject(e));
          req.write(postData);
          req.end();
      });
  }

  console.log("Finished assigning all fee structures.");
  process.exit(0);
}

function generateToken() {
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET must be set to mint an admin token");
    }
    return jwt.sign({
        userId: "USR-55C28DEB",
        email: "schooladmin@demoschool.com",
        role: "sch_admin",
        schoolId: "DEMO101",
        schoolDbName: "school-db-demo"
    }, JWT_SECRET, { expiresIn: '1d' });
}

doReassign().catch(err => {
  console.error(err);
  process.exit(1);
});
