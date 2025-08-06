import express from "express";
import {
  getAllProjects,
  getsingleProject,
  createProject,
  updateProjectStatus,
  deleteProject,
} from "../Controllers/project.Controllers.js";
import {verifyJWT} from "../Middlewares/Auth.middleware.js";

const projectRouter = express.Router();

const reqLogger = (req, res, next) => {
    console.log("Request made to  :" + req.originalUrl);
    next();
};

// Route for fetching all projects
projectRouter.get("/", verifyJWT , reqLogger,  getAllProjects);

// Route for fetching a single project
projectRouter.get("/:id", verifyJWT , reqLogger,  getsingleProject);

// Route for creating a project
projectRouter.post("/", verifyJWT , reqLogger,  createProject);

// Route for updating a project status
projectRouter.put("/:id/updateStatus",  verifyJWT , reqLogger, updateProjectStatus);

// Route for deleting a project
projectRouter.delete("/:id", verifyJWT , reqLogger,  deleteProject);

export default projectRouter;
