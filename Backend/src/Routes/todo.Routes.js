import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../Controllers/todo.Controller.js';
import {verifyJWT} from '../Middlewares/Auth.middleware.js';



// Create a new router
const todoRouter = express.Router();

const reqLog = (req, res, next) => {
    console.log("Request made to  :" + req.originalUrl);
    next();
};

// Get all todos
todoRouter.get('/', verifyJWT , reqLog , getTodos);


// Create a new todo
todoRouter.post('/', verifyJWT , reqLog , createTodo);

// Update a todo
todoRouter.patch('/:id', verifyJWT , reqLog , updateTodo);

// Delete a todo
todoRouter.delete('/:id', verifyJWT , reqLog , deleteTodo);

export default todoRouter;