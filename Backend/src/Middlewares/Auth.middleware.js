import jwt from "jsonwebtoken";
import { ApiError } from "../Utilities/ApiError.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";
import { User } from "../Models/user.Models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Access: Token missing");
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find the user associated with the token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized Access: Invalid token");
    }

    // Attach user to the request object
    req.user = user;

    // Call the next middleware
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message); // Log the error
    throw new ApiError(401, error?.message || "Unauthorized Access: Invalid token");
  }
});
