import express from 'express';
import {
    getTimesheets
} from '../Controllers/timesheets.Controller.js';
import {verifyJWT} from '../Middlewares/Auth.middleware.js';

const timesheetsRouter = express.Router();


const reqLog = (req, res, next) => {
    console.log("Request made to  :" + req.originalUrl);
    next();
}

// Get all timesheets

timesheetsRouter.get('/', verifyJWT , reqLog , getTimesheets);

export default timesheetsRouter;