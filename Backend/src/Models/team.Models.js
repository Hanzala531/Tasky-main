import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    // user can add members to the team by entering their email address through which a request will be sent to the user to join the team which can be either accepted or rejected by the user

    teamAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensuring a team always has an admin
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    projectWorked: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
          },
        ],
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Team = mongoose.model("Team", teamSchema);
