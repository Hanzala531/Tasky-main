import express from "express";
import {
  getAllUsers,
  // getSingleUser,
  updateUserRole,
  registerUser,
  showTimeWorked,
  addAvatar,
  saveTimeWorked,
  updateUser,
  loginUser,
  deleteUser,
  logoutUser,
} from "../Controllers/user.Contollers.js";
import { upload } from "../Middlewares/multer.middleware.js";
import {verifyJWT} from "../Middlewares/auth.middleware.js";

const userRouter = express.Router();

const reqLog = (req, res, next) => {
  console.log("Request made to  :" + req.originalUrl);
  next();
};

userRouter.get("/", (req, res) => {
  res.send("User API");
});
// route for getting all users
userRouter.route("/").get(reqLog, verifyJWT, getAllUsers);
// route for registering a user
userRouter.route("/register").post(reqLog, registerUser);
// route for getting a single user
// userRouter.route("/:id").get(reqLog, verifyJWT, getSingleUser);
// route for logging in user
userRouter.route("/login").post(reqLog,  loginUser);
// route for logging out user
userRouter.route("/logout/").post(verifyJWT , reqLog, logoutUser);
// route for updating user
userRouter.route("/:id").put(reqLog, verifyJWT, updateUser);
// route for deleting user
userRouter.route("/:id").delete(reqLog, verifyJWT, deleteUser);
// Route for saving the time worked
userRouter.route("/time").post(reqLog, verifyJWT, saveTimeWorked);
// Route for showing the time worked
userRouter.route("/time").get(reqLog, verifyJWT , showTimeWorked);
// route for updating user role
userRouter.route("/:id/role").put(reqLog, verifyJWT, updateUserRole);
// route to add user avatar
userRouter.route("/:id/avatar").post(upload.single("avatar"), addAvatar);

export default userRouter;
