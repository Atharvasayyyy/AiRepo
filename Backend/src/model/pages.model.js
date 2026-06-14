const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
{
    title:{
        type:String,
        required:true,
        trim:true
    },

    content:{
        type:String,
        default:""
    },

    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workspace",
        required:true
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    modifiedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    isArchived:{
        type:Boolean,
        default:false
    }
},
{
    timestamps:true
}
);


const Page = mongoose.model("Page", pageSchema);
module.exports = Page;