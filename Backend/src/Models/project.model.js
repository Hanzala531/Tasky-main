import mongoose from 'mongoose';
// import { TimeWorked } from './timer.Models';

const projectSchema = new mongoose.Schema({
    createdBy :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
    },
    name :{
        type : String,
        required : true,
        trim : true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    description : {
        type : String,
        required : true,
        trim : true
    },
    timeWorked: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TimeWorked",
          }
        ],
    startDate : {
        type : Date,
        required : true
    },
    endDate : {
        type : Date,
    },
    deadline : {
        type : Date,
        required : true
    },
    status : {
        type : String,
        enum : ["Pending", "In Progress", "Completed", "On Hold" , "Cancelled"],
        default : "Pending",
    },
    memberStatus : {
        type : String,
        enum : ["Active", "Inactive", "On leave"],
        default : "Active",
    }

});


export const Project = mongoose.model('Project', projectSchema);