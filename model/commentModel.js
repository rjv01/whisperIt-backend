const mongoose  = require("mongoose");

const commentsSchema = mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"User",
        },
        post:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"Post",
        },
        text:{
            type:String,
            required:true,
        },
        parent:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment",
            default:null,
        },
    },
    {
        timestamps:true,
    }
);

const Comment = mongoose.model("Comment",commentsSchema);
module.exports = Comment;