import { ApiError } from "../Utilities/ApiError.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { TimeWorked } from "../Models/timer.Models.js";
import { User } from "../Models/user.Models.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";


// Get all timesheets of the user
const getTimesheets = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ApiError("User not found", 404));
    }
    const timesheets = await TimeWorked.find({ user: user._id });
    res.status(200).json(new ApiResponse("Timesheets fetched successfully", timesheets));

    
});

export { getTimesheets };