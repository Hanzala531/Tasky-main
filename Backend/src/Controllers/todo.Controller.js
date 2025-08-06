import { Todo } from "../Models/todo.Models.js";
import { asyncHandler } from "../Utilities/asyncHandler.js";
import { ApiResponse } from "../Utilities/ApiResponse.js";
import { ApiError } from "../Utilities/ApiError.js";


// Create a new todo
const createTodo = asyncHandler(async (req, res, next) => {
    try {
        const { title } = req.body;
        
        if (!title ) {
            return res.json(new ApiResponse(400, "Please provide all the required fields"));
        }

        const user = req.user._id;
        // Set status to unchecked by default
        const newTodo = await Todo.create({ user, title, status: 'unchecked' });

        if (!newTodo) {
            return res.json(new ApiResponse(400, "Error in creating todo"));
        }

        res.status(201).json({
            success: true,
            todo: newTodo,
            message: "Todo created successfully",
        });
    } catch (error) {
        console.error("Error creating todo:", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});


// Get all todos of the logged-in user
const getTodos = asyncHandler(async (req, res, next) => {
    try {
        const todos = await Todo.find({ user: req.user._id });
        
        if (!todos || todos.length === 0) {
            return res.json(new ApiResponse(404, "No todos found"));
        }

        res.status(200).json({
            success: true,
            todos,
            message: "All todos fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching all todos:", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});


// Get a single todo
const getTodo = asyncHandler(async (req, res, next) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
        
        if (!todo) {
            return res.json(new ApiResponse(404, "Todo not found"));
        }

        res.status(200).json({
            success: true,
            todo,
            message: "Todo fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching single todo:", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});


// Update a todo status
const updateTodo = asyncHandler(async (req, res, next) => {
    try {
        // Handle both 'status' and 'completed' property from request
        const { status, completed } = req.body;
        let updateData = {};

        // If completed is provided (from frontend), translate to backend status format
        if (completed !== undefined) {
            updateData.status = completed ? 'checked' : 'unchecked';
        }
        // If status is directly provided
        else if (status) {
            updateData.status = status;
        }
        else {
            return res.json(new ApiResponse(400, "Please provide status information"));
        }

        const todo = await Todo.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            updateData,
            { new: true }
        );

        if (!todo) {
            return res.json(new ApiResponse(404, "Todo not found"));
        }

        res.status(200).json({
            success: true,
            todo,
            message: "Todo status updated successfully",
        });
    } catch (error) {
        console.error("Error updating todo status:", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});


// Delete a todo
const deleteTodo = asyncHandler(async (req, res, next) => {
    try {
        const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });

        if (!todo) {
            return res.json(new ApiResponse(404, "Todo not found"));
        }

        await todo.deleteOne();

        res.status(200).json({
            success: true,
            message: "Todo deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting todo:", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error"));
    }
});


export { createTodo, getTodos, getTodo, updateTodo, deleteTodo };
