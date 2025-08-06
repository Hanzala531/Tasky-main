import express, { urlencoded } from "express";
import cors from "cors";
import cookieparser from "cookie-parser";


const app = express();

// middlewares
app.use(
  cors()
);

app.options("*", cors());

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

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Loop Win API",
    version: "1.0.0",
    endpoints: {
      users: "/api/v1/users",
    },
    documentation: "Visit our endpoints to explore the API"
  });
});

// creating user api
import userRouter from "./Routes/user.Routes.js";
app.use("/api/v1/users", userRouter);




export { app };