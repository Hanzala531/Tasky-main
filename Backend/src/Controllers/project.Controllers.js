import mongoose from "mongoose";
import { ApiError } from "../Utilities/ApiError.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";
import { Project } from "../Models/project.model.js";
import  { User } from "../Models/user.Models.js";

// Api controller for fetching all projects

const getAllProjects = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; // Get the requesting user's ID

    // Fetch only projects where the user is a member
    const projects = await Project.find ({ members: userId });

    if (!projects || projects.length === 0) {
      return res.json(new ApiResponse(404, "No projects found for this user"));
    }

    res.status(200).json({
      success: true,
      projects,
      message: "User-specific projects fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
});


// creating controller to search for a project by id

const getsingleProject = asyncHandler(async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.json(new ApiResponse(404, "No project found with this name"));
    }

    res.status(200).json({
      success: true,
      project,
      message: "Project fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching single project:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
});

// Controller to create a project
const createProject = asyncHandler(async (req, res) => {
  console.log(req.body);

  try {
    const { name, description, members, startDate, deadline } = req.body;

    if (!name || !description || !startDate || !deadline) {
      return res.status(400).json(new ApiResponse(400, "Please provide all the required fields"));
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json(new ApiResponse(400, "Please provide at least one member"));
    }

    // Find users by email and get their ObjectIds
    const memberObjects = await User.find({ email: { $in: members } }).select("_id email");

    // Extract ObjectIds and emails of valid members
    const validMemberIds = memberObjects.map(user => user._id);
    const validMemberEmails = memberObjects.map(user => user.email);

    // Identify invalid emails
    const invalidEmails = members.filter(email => !validMemberEmails.includes(email));

    // Accessing user from req.user after verifyJWT middleware
    const createdBy = req.user._id;

    // Create the project with valid members
    const project = await Project.create({
      createdBy,
      name,
      description,
      startDate,
      members: [...validMemberIds, createdBy], // Add the creator to the members array
      deadline,
    });

    if (!project) {
      return res.status(400).json(new ApiResponse(400, "Error in creating project"));
    }

    // Prepare the response message
    const responseMessage = invalidEmails.length > 0
      ? `Project created successfully, but the following emails are not registered: ${invalidEmails.join(", ")}`
      : "Project created successfully";

    res.status(201).json({
      success: true,
      project,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
});

// Controller to update project status and set endDate when completed
const updateProjectStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.json(new ApiResponse(400, "Please provide status"));
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.json(new ApiResponse(404, "Project not found"));
    }

    project.status = status;

    // If status is updated to "Completed", set endDate to current date
    if (status.toLowerCase() === "completed" || status.toLowerCase() === "cancelled") {
      project.endDate = new Date();
    }

  

    await project.save();

    res.status(200).json({
      success: true,
      project,
      message: "Project status updated successfully",
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
});


// Api route to delete a project
const deleteProject = asyncHandler(async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, "Project not found"));
    }

    // Check if the logged-in user is the creator of the project
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json(new ApiResponse(403, "You are not authorized to delete this project"));
    }

    await project.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json(new ApiResponse(500, "Internal server error"));
  }
});


export {
  getAllProjects,
  getsingleProject,
  createProject,
  updateProjectStatus,
  deleteProject,
};
