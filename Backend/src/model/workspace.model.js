const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    description:{
        type:String,
        default:""
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    members:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:false
            },

            role:{
                type:String,
                enum:["owner","admin","member"],
                default:"member",
                required:false
            }
        }
    ]
},
{
    timestamps:true
}
);

module.exports =
mongoose.model("Workspace",
    workspaceSchema
);