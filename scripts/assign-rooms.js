require("dotenv").config({ path: "./apps/sm-user-service/.env" });
const mongoose = require("mongoose");
const crypto = require("crypto");
const { ClassSchema } = require("../packages/shared/models");
const RoomSchema = require("../packages/shared/models/room.model");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Please set MONGO_URI");
  process.exit(1);
}

const SCHOOL_DB_NAME = "school-db-demo";
const SCHOOL_ID = "DEMO101";

const generateId = (prefix) =>
  `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function assignRooms() {
  console.log("Connecting to MongoDB...");
  const mainConnection = await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");
  const schoolDb = mainConnection.connection.useDb(SCHOOL_DB_NAME, { useCache: true });

  const Class = schoolDb.model("Class", ClassSchema);
  const Room = schoolDb.model("Room", RoomSchema);

  const classes = await Class.find({ status: 'active' });
  const rooms = await Room.find({ status: 'active' });

  let allSections = [];
  classes.forEach(c => {
      c.sections.forEach(s => {
          allSections.push({ classId: c.classId, sectionId: s.sectionId });
      });
  });

  // Create additional rooms if needed
  if (rooms.length < allSections.length) {
      const needed = allSections.length - rooms.length;
      console.log(`Creating ${needed} additional rooms...`);
      let maxRoomNum = rooms.length;
      for (let i = 1; i <= needed; i++) {
          const num = maxRoomNum + i;
          const newRoom = await Room.create({
              roomId: generateId("RM"),
              schoolId: SCHOOL_ID,
              name: `Exam Hall ${num}`,
              code: `EH-${num}`,
              type: "hall",
              capacity: 40,
              floor: `Floor ${Math.ceil(num/5)}`,
              building: "Main Block"
          });
          rooms.push(newRoom);
      }
  }

  // Assign class reference to rooms
  for (let i = 0; i < allSections.length; i++) {
      const section = allSections[i];
      const room = rooms[i];

      // Remove existing class refs
      room.equipment = (room.equipment || []).filter(e => !e.startsWith('CLASS_REF:'));
      
      // Add new class ref
      room.equipment.push(`CLASS_REF:${section.classId}#${section.sectionId}`);
      
      await Room.updateOne({ _id: room._id }, { equipment: room.equipment });
  }

  console.log(`Successfully assigned ${allSections.length} class sections to rooms!`);
  process.exit(0);
}

assignRooms().catch(err => {
  console.error(err);
  process.exit(1);
});
