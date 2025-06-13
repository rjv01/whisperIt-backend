const mongoose = require("mongoose");
const { type } = require("os");

const postSchema = mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"User",
        },
        title:{
            type:String,
            required: [true, "Please add a title"],
            trim: true,
        },
        text:{
            type: String,
            required: [true, "Please add a description"],
            trim: true,
        },
        views:{
            type:Number,
            default:0,
        },
        upvotedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        ],
        downvotedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        ],
    },
    {
        timestamps:true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

postSchema.virtual("upvotes").get(function(){
    return this.upvotedBy.length;
});

postSchema.virtual("downvotes").get(function(){
    return this.downvotedBy.length;
});

const Post = mongoose.model("Post",postSchema);
module.exports = Post;