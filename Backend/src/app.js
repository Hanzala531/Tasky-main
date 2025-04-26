import express, { urlencoded } from "express";
import cors from "cors";
import cookieparser from "cookie-parser";


const app = express();

// middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "30kb",
  })
);

app.use(
  urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieparser());

// creating user api
import userRouter from "./Routes/user.Routes.js";
app.use("/api/v1/users", userRouter);

// creating project api
import projectRouter from "./Routes/project.Routes.js";
app.use("/api/v1/projects", projectRouter);


// creating notification api
import notificationRouter from "./Routes/notification.Routes.js";
app.use("/api/v1/notifications", notificationRouter);


// creating team api
import teamRouter from "./Routes/team.Routes.js";
app.use("/api/v1/teams", teamRouter);

// todo api
import todoRouter from "./Routes/todo.Routes.js";
app.use("/api/v1/todos", todoRouter);

// timesheet api
import timesheetsRouter from "./Routes/timesheets.Routes.js";
app.use("/api/v1/timesheets", timesheetsRouter);

export { app };
