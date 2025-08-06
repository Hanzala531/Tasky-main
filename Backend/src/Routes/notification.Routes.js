import express from 'express';
import { verifyJWT } from '../Middlewares/Auth.middleware.js';
import {
    getNotifications,
    updateNotification,
    deleteNotification,
    sendNotification,
    sendNotificationToAll
} from '../Controllers/notification.Controllers.js'; 

const notificationRouter = express.Router();
const reqLogger = (req, res, next) => {
    console.log("Request made to /notifications route");
    next();
} 



// Route to get all notifications for the logged-in user
notificationRouter.get("/", 
     reqLogger , 
     verifyJWT ,
     getNotifications);



    //  Route to send a notification to all users
    notificationRouter.post("/send/all",
    reqLogger,
    verifyJWT,
    sendNotificationToAll
    );
    
// Route to send a notification
notificationRouter.post(" /send", 
     reqLogger , 
     verifyJWT ,
     sendNotification);

// Route to update notification status
notificationRouter.put( "/:id", 
     reqLogger , 
     verifyJWT ,
     updateNotification);

// Route to delete a notification
notificationRouter.delete( "/:id", 
     reqLogger , 
     verifyJWT ,
     deleteNotification);

export default notificationRouter;
