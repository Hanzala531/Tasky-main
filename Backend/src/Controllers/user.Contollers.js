import mongoose from "mongoose";
import { User } from "../Models/user.Models.js";
import { ApiError } from "../Utilities/ApiError.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { uploadOnCloudinary } from "../Utilities/cloudinary.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";
import { TimeWorked } from "../Models/timer.Models.js";

// Access and Refresh Tokens
const generateAccessAndRefreshTokens = async (userid) => {
  try {
    const user = await User.findById(userid);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Call the methods on the user instance
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error); // Log the error
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// get all users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new ApiError(500, "Something went wrong while fetching users");
  }
});

// // Api controller for fetching a single user
// const getSingleUser = asyncHandler(async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return new ApiResponse(201, "User not found");
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     throw new ApiError(500, "Something went wrong while fetching user");
//   }
// });

// Api controller for updating user role

const updateUserRole = asyncHandler(async (req, res) => {
  try {
    // const { id } = req.params;
    const { role } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return new ApiResponse(201, "User not found");
    }
    user.status = role;
    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new ApiError(500, "Something went wrong while updating user role");
  }
});

// Controller for registering a user

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.json(new ApiResponse(400, "All Fields are required"));
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.json(
        new ApiResponse(409, "User with this email already exists")
      );
    }

    //  Creating the new user on database
    const newUser = await User.create({
      username,
      email,
      password,
    });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    // check if user is created

    if (!createdUser) {
      return res.json(
        new ApiResponse(
          500,
          "We are facing some issues in creating your accound \n Please try again later"
        )
      );
    }

    // Sending response of user created

    res.status(201).json({
      success: true,
      user: createdUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    throw new ApiError(500, "Something went wrong while registering user");
  }
});

// controller for adding user avatar
const addAvatar = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.json(new ApiResponse(404, "User not found"));
    }

    // Extract the avatar file path
    const avatarFile = req.files?.avatar;
    const avatarLocalPath = avatarFile
      ? Array.isArray(avatarFile)
        ? avatarFile[0].path
        : avatarFile.path
      : null;

    if (!avatarLocalPath) {
      return res.json(new ApiResponse(400, "No avatar file provided"));
    }

    // Upload to Cloudinary
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarUrl || !avatarUrl.url) {
      return res.json(new ApiResponse(500, "Failed to upload avatar"));
    }

    // Update user's avatar and save
    user.avatar = avatarUrl.url;
    await user.save();

    // Send response
    res.status(200).json({
      success: true,
      user,
      message: "Avatar uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }
});



// Controller for saving time worked
const saveTimeWorked = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      console.log("Unauthorized: req.user is missing");
      throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    const userId = req.user._id;
    console.log("User ID:", userId);
    console.log("Request Body:", req.body);

    // Fix: Use correct property name from request body
    const { timeWorked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid User ID format:", userId);
      throw new ApiError(400, "Invalid user ID format");
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      throw new ApiError(404, "User not found");
    }

    if (!timeWorked || typeof timeWorked !== "number" || timeWorked <= 0) {
      console.log("Invalid timeWorked value:", timeWorked);
      throw new ApiError(400, "Invalid timeWorked value");
    }

    // Create new TimeWorked entry
    const newTimeWorked = new TimeWorked({
      user: userId,
      hours: timeWorked, // Fix: Use timeWorked instead of hours
    });

    const savedTimeWorked = await newTimeWorked.save();
    console.log("TimeWorked saved successfully:", savedTimeWorked);

    // Push to User's timeWorked array
    user.timeWorked.push(savedTimeWorked._id);
    await user.save();
    console.log("Updated User with TimeWorked reference:", user);

    res.status(201).json({
      message: "Time worked saved successfully",
      data: savedTimeWorked,
    });
  } catch (error) {
    console.error("Error saving TimeWorked:", error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});


// Controller to show time worked this week
const showTimeWorked = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch the user and populate timeWorked references
    const user = await User.findById(userId).populate("timeWorked");
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found"));
    }

    // Get today's date in UTC
    const today = new Date();
    const todayUTC = new Date(today.getTime() + today.getTimezoneOffset() * 60000);

    // Calculate Last Week's Start (Monday 00:00:00 UTC)
    const startOfLastWeek = new Date(todayUTC);
    startOfLastWeek.setUTCDate(todayUTC.getUTCDate() - todayUTC.getUTCDay() - 6); // Last Monday
    startOfLastWeek.setUTCHours(0, 0, 0, 0); // Set to start of day

    // Calculate Last Week's End (Sunday 23:59:59 UTC)
    const endOfLastWeek = new Date(todayUTC);
    endOfLastWeek.setUTCDate(todayUTC.getUTCDate() + 6); // Last Sunday
    endOfLastWeek.setUTCHours(23, 59, 59, 999); // Set to end of day

    // console.log("✅ Start of Last Week (UTC):", startOfLastWeek.toISOString());
    // console.log("✅ End of Last Week (UTC):", endOfLastWeek.toISOString());

    // Fetch all user entries for debugging
    // const allEntries = await TimeWorked.find({ user: userId });
    // console.log("✅ All Time Worked Entries for User:", allEntries);

    // Get time worked entries from last week (using correct UTC filtering)
    const lastWeekTimeWorked = await TimeWorked.find({
      user: userId,
      date: { $gte: startOfLastWeek, $lte: endOfLastWeek },
    });

    // console.log("✅ Filtered Last Week Entries:", lastWeekTimeWorked);

    // Calculate total hours worked last week
    const totalHoursLastWeek = lastWeekTimeWorked.reduce(
      (total, entry) => total + (entry.hours || 0),
      0
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalHoursLastWeek,
          entries: lastWeekTimeWorked,
        },
        "Time worked retrieved successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error showing time worked:", error);
    throw new ApiError(500, "Something went wrong while showing time worked");
  }
});




// Update User controller
const updateUser = asyncHandler(async (req, res) => {
  try {
    const id = req.user.id;
    const { username, email, password } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.json(new ApiResponse(404, "User not found"));
    }

    // Update user fields only if provided
    if (username) user.username = username.toLowerCase();
    if (email) user.email = email;

    // If password is updated, hash it before saving
    if (password) user.password = password;

    // Save the updated user
    await user.save();

    // Send response
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw new ApiError(500, "Something went wrong while updating user");
  }
});



// Login User controller
const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({ message: "All Fields are required" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid User Credentials" });
    }

    // Password validation
    const isPasswordValid = await user.isPasswordCorrect(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid User Credentials" });
    }

    // Generating access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Send token both as a **cookie** and in the **response body**
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        loggedInUser,
        accessToken, // ✅ Ensure this is included
        message: "User Logged In Successfully",
      });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong while logging in user" });
  }
});

// Delete User controller
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw res.json(new ApiError(404, "User not found"));
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new ApiError(500, "Something went wrong while deleting user");
  }
});

// Logout User controller
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out user:", error);
    throw new ApiError(500, "Something went wrong while logging out user");
  }
});

export {
  getAllUsers,
  // getSingleUser,
  updateUserRole,
  registerUser,
  saveTimeWorked,
  addAvatar,
  updateUser,
  showTimeWorked,
  loginUser,
  deleteUser,
  logoutUser,
};
