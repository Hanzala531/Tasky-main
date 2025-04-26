import {ApiError} from '../Utilities/ApiError.js';
import {ApiResponse} from '../Utilities/ApiResponse.js';
import {Notification} from '../Models/notification.Models.js';
import {User} from '../Models/user.Models.js';
import {Team} from '../Models/team.Models.js';
import {asyncHandler} from '../Utilities/asyncHandler.js';

// Funtion to send notification to all registered users
const sendNotificationToAll = asyncHandler(async (req, res, next) => {
    try {
        const { message } = req.body;
        const sender = req.user.id;

        if (!message) {
            return res.json(new ApiResponse(400, "Message is required"));
        }

        // Fetch all users except the sender
        const users = await User.find({ _id: { $ne: sender } }).select("_id");

        if (!users.length) {
            return res.json(new ApiResponse(400, "No users found to send notifications"));
        }

        // Prepare notifications for all users
        const notifications = users.map(user => ({
            sender,
            receiver: user._id,
            message,
        }));

        // Insert all notifications at once
        await Notification.insertMany(notifications);

        return res.json(new ApiResponse(200, "Notification sent to all users successfully"));

    } catch (error) {
        console.error("Error sending notifications:", error);
        return res.json(new ApiResponse(500, "Internal server error"));
    }
});



// Function to send a notification to a user 
const sendNotification = asyncHandler(async (req, res, next) => {
    try {
        const { receiverEmail, teamId, message } = req.body;
        const sender = req.user.id;
    
        const receiver = await User.findOne (
            {
                email: receiverEmail,
            }
        )
        .select("_id")
        
        if (!receiver) {
            return res.json(new ApiResponse(400, "User not found"));
        }
        
        const team = await Team.findById(teamId).select("_id");
        
        if (!team) {
            return res.json(new ApiResponse(400, "Team not found"));
        }
        
        const notification = new Notification({
        sender,
        receiver: receiver._id,
        teamId: team._id,
        message : message || "You have been invited to join the team.",
    });
    
    if (!notification) {
        return res.json(new ApiError(400, "Failed to send notification"));
    }
    
    await notification.save();
    
    return res.json(new ApiResponse(200, "Notification sent successfully"));
    } catch (error) {
        console.error("Error sending notification:", error);
        return res.json(new ApiResponse(500, "Internal server error"));
        
    }

})



// Function to get all notifications for a user
const getNotifications = asyncHandler(async (req, res, next) => {
    try {
        const receiver = req.user._id;

        const notifications = await Notification.find({ receiver })
        .populate("sender", "name")
        .populate("teamId", "name")
        
        if (!notifications) {
            return res.json(new ApiResponse(400, "No notifications found"));
        }

        return res.json(new ApiResponse(200, "Notifications retrieved successfully", notifications));

    } catch (error) {
        console.error("Error getting notifications:", error);
        return res.json(new ApiResponse(500, "Internal server error"));        
    }
});


// Function to update notification status
const updateNotification = asyncHandler(async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const {status}  = req.body ;
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.json(new ApiResponse(400, "Notification not found"));
        }

        notification.status = status;       
       
        
        await notification.save();
        
        return res.json(new ApiResponse(200, "Notification updated successfully"));
    } catch (error) {
        console.error("Error updating notification:", error);
        return res.json(new ApiResponse(500, "Internal server error"));
    }
});

// Function to delete a notification
const deleteNotification = asyncHandler(async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.json(new ApiResponse(400, "Notification not found"));
        }
        
        await notification.remove();
        
        return res.json(new ApiResponse(200, "Notification deleted successfully"));
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.json(new ApiResponse(500, "Internal server error"));
    }
});


export {
    sendNotification,
    sendNotificationToAll,
    getNotifications, 
    updateNotification, 
    deleteNotification
};