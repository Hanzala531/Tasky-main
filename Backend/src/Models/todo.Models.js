import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,       
        required: true
    },
  
    status: {
        type: String,
        enum: ['checked', 'unchecked'],
        default: 'unchecked'
    },
    date: {
        type: Date,
        default: Date.now
    }
});


export const Todo = mongoose.model('Todo', todoSchema);