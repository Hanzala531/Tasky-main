import mongoose from "mongoose";

const timeWorkedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  hours: {
    type: Number,
    required: true,
  },
});

export const TimeWorked = mongoose.model("TimeWorked", timeWorkedSchema);
