// User Model (user.Models.js)
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "default.jpg",
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    status: {
      type: String,
      enum: ["Admin", "User", "Member"],
      default: "User",
    },
    timeWorked: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TimeWorked",
      }
    ],
    
  },
  { timestamps: true }
);

// Method for hashing password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method for comparing password
userSchema.methods.isPasswordCorrect = async function (
  enteredPassword,
  dbPassword
) {
  const isValid = await bcrypt.compare(enteredPassword, dbPassword);
  return isValid;
};

// Method for generating access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      _username: this.username, // Corrected line
      _email: this.email,
      _fullname: this.fullname, // Make sure fullname is defined in schema
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}`,
    }
  );
};

// Method for generating refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: `${process.env.REFRESH_TOKEN_EXPIRY}`,
    }
  );
};

export const User = mongoose.model("User", userSchema);

