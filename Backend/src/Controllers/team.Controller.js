import { ApiError } from "../Utilities/ApiError.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { Notification } from "../Models/notification.Models.js";
import { User } from "../Models/user.Models.js";
import { Team } from "../Models/team.Models.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";


const getAllTeams = asyncHandler(async (req, res, next) => {
    try {
        // Extract the user ID from the request (assuming it's in the request object)
        const userId = req.user._id;

        // Fetch all teams and populate the necessary fields
        const teams = await Team.find()
            .populate("teamAdmin", "name email")
            .populate("members.user", "name email");

        // Filter teams to include only those where the user is a member
        const userTeams = teams.filter(team => 
            team.members.some(member => member.user._id.toString() === userId.toString())
        );

        return res.status(200).json(new ApiResponse(200, "All teams fetched successfully", userTeams));

    } catch (error) {
        return next(new ApiError(500, "Internal server error"));
    }
});

/**
 * Create a new team
 */
const createTeam = asyncHandler(async (req, res, next) => {
    const { name, description } = req.body;
    const teamAdmin = req.user.id; // Admin who creates the team

    if (!name || !description) {
        return next(new ApiError(400, "Team name and description are required"));
    }

    const team = await Team.create({ name, description, teamAdmin, members: [{ user: teamAdmin, status: "accepted" }] });

    return res.status(201).json(new ApiResponse(201, "Team created successfully", team));
});

/**
 * Invite multiple users to join the team
 */
const addToTeam = asyncHandler(async (req, res, next) => {
    try {
        const { teamId } = req.params;
        const sender = req.user._id; // Get sender ID from authenticated user
        console.log("Request body:", req.body);
        
        // Handle both single email and array of emails
        let emails = [];
        
        // Check if a single email was provided
        if (req.body.email) {
            emails = [req.body.email];
        } 
        // Check if an emails array was provided
        else if (req.body.emails && Array.isArray(req.body.emails)) {
            emails = req.body.emails;
        }
        // If neither was provided, return an error
        else {
            return next(new ApiError(400, "Please provide an email or an array of emails"));
        }

        if (!teamId) {
            return next(new ApiError(400, "Team ID is required in URL"));
        }

        if (emails.length === 0) {
            return next(new ApiError(400, "No valid emails provided"));
        }

        // Trim and convert emails to lowercase for consistent searching
        emails = emails.map(email => typeof email === 'string' ? email.trim().toLowerCase() : email);
        console.log("Processed emails:", emails);
        

        const team = await Team.findById(teamId);
        if (!team) {
            return next(new ApiError(404, "Team not found"));
        }

        const alreadyMembers = [];
        const invitedUsers = [];
        const notFoundUsers = [];
        const notifications = [];

        for (const email of emails) {
            const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") }).select("_id");

            if (!user) {
                notFoundUsers.push(email);
                continue;
            }

            const isAlreadyMember = team.members.some(member => member.user.toString() === user._id.toString());
            if (isAlreadyMember) {
                alreadyMembers.push(email);
                continue;
            }

            // Add user to team as "pending"
            team.members.push({ user: user._id, status: "pending" });
            invitedUsers.push(email);

            // Create a notification
            notifications.push({
                sender,
                receiver: user._id,
                teamId: team._id,
                message: `You have been invited to join the team "${team.name}".`
            });
        }

        // Save notifications in bulk
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        // Save team updates
        await team.save();

        return res.status(200).json(new ApiResponse(200, "User invitations processed successfully", {
            invitedUsers,
            alreadyMembers,
            notFoundUsers,
            success: invitedUsers.length > 0
        }));

    } catch (error) {
        console.error("Error in addToTeam:", error);
        return next(new ApiError(500, "Internal server error"));
    }
});

  
/**
 * Accept or decline a team invite
 */
const updateTeamInviteStatus = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    const { status } = req.body; // "accepted" or "declined"
    const userId = req.user.id;

    if (!["accepted", "declined"].includes(status)) {
        return next(new ApiError(400, "Invalid status. Use 'accepted' or 'declined'"));
    }

    const team = await Team.findById(teamId);
    if (!team) {
        return next(new ApiError(404, "Team not found"));
    }

    const memberIndex = team.members.findIndex(member => member.user.toString() === userId);
    if (memberIndex === -1) {
        return next(new ApiError(400, "You have not been invited to this team"));
    }

    team.members[memberIndex].status = status;
    await team.save();

    return res.status(200).json(new ApiResponse(200, `Invite ${status} successfully`));
});

//  Get team details
const getTeamDetails = asyncHandler(async (req, res, next) => {
    try {
        const { teamId } = req.params;
        
        // Fetch the team and populate teamAdmin, members.user, and projectWorked references
        const team = await Team.findById(teamId)
        .populate({
              path: "teamAdmin",
              select: "name email"
            })
            .populate({
                path: "members.user", // Ensure this is the correct reference to the User model
                select: "username email" // Adjust if necessary
            })
            .populate({
              path: "projectWorked",
              select: "hours date"
            });
            
            if (!team) {
                return next(new ApiError(404, "Team not found"));
      }
    
      // Filter members to include only those with status "accepted"
      team.members = team.members.filter(member => member.status === "accepted");
      
      // Structure the response to include team name, members, and project worked
      const teamDetails = {
        name: team.name,
        members: team.members.map(member => ({
          userId: member._id.toString(),
          name: member.user ? member.user.username : "Name not available", // Provide a default message if user details are undefined
          email: member.user ? member.user.email : "Email not available" // Provide a default message if user details are undefined
        })),
        projectWorked: team.projectWorked.map(pw => ({
          hours: pw.hours,
          date: pw.date.toISOString().split('T')[0] // Format the date to YYYY-MM-DD
        }))
      };
  
      console.log(teamDetails);
        
      return res.json(new ApiResponse(200, "Team details retrieved", teamDetails));
    } catch (error) {
      console.error("Error getting team details:", error);
      return next(new ApiError(500, "Internal server error"));
    }
  });
  

  /**
   * Remove a member from the team
   */
  const removeFromTeam = asyncHandler(async (req, res, next) => {
      const { teamId, userId } = req.params;
      const adminId = req.user.id; // Admin making the request
  
      const team = await Team.findById(teamId);
      if (!team) {
          return next(new ApiError(404, "Team not found"));
      }
  
      if (team.teamAdmin.toString() !== adminId) {
          return next(new ApiError(403, "Only the team admin can remove members"));
      }
  
      team.members = team.members.filter(member => member.user.toString() !== userId);
      await team.save();
  
      return res.status(200).json(new ApiResponse(200, "Member removed successfully"));
  });


/**
 * Delete a team
 */
const deleteTeam = asyncHandler(async (req, res, next) => {
    const { teamId } = req.params;
    const adminId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
        return next(new ApiError(404, "Team not found"));
    }

    if (team.teamAdmin.toString() !== adminId) {
        return next(new ApiError(403, "Only the team admin can delete the team"));
    }

    await team.deleteOne();

    return res.status(200).json(new ApiResponse(200, "Team deleted successfully"));
});

export {
    getAllTeams,
    createTeam,
    addToTeam,
    updateTeamInviteStatus,
    getTeamDetails,
    removeFromTeam,
    deleteTeam
};

