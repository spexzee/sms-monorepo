const mongoose = require("mongoose");

const aiDraftEntrySchema = new mongoose.Schema({
    classId: { type: String, required: true },
    sectionId: { type: String, required: true },
    subjectId: { type: String, required: true },
    teacherId: { type: String, required: true },
    dayOfWeek: { type: String, required: true },
    periodNumber: { type: Number, required: true },
}, { _id: false });

const timetableAIDraftSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      required: true,
    },
    entries: {
        type: [aiDraftEntrySchema],
        default: []
    },
    rules: {
        type: mongoose.Schema.Types.Mixed
    },
    version: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    }
  },
  {
    timestamps: true,
  },
);

// Compound unique index on schoolId and version to support versioning
timetableAIDraftSchema.index({ schoolId: 1, version: 1 }, { unique: true });

module.exports = timetableAIDraftSchema;
