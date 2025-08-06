import express from "express";
import { 
    getAllTeams,
    createTeam, 
    addToTeam, 
    updateTeamInviteStatus, 
    getTeamDetails, 
    removeFromTeam, 
    deleteTeam 
} from "../Controllers/team.Controller.js";
import { verifyJWT } from "../Middlewares/Auth.middleware.js";

const teamRouter = express.Router();

const reqLog = (req, res, next) => {
    console.log("Request made to  :" + req.originalUrl);
    next();
}

teamRouter.get("/",verifyJWT , reqLog ,  getAllTeams);
teamRouter.post("/create",verifyJWT , reqLog ,  createTeam);
teamRouter.post("/:teamId/invite",verifyJWT , reqLog ,  addToTeam);
teamRouter.put("/:teamId/respond", verifyJWT , reqLog , updateTeamInviteStatus);
teamRouter.get("/:teamId",verifyJWT , reqLog ,  getTeamDetails);
teamRouter.delete("/:teamId/remove/:userId",verifyJWT , reqLog ,  removeFromTeam);
teamRouter.delete("/:teamId",verifyJWT , reqLog ,  deleteTeam);

export default teamRouter;

