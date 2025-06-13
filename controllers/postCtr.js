const asyncHandler = require("express-async-handler");
const Post = require("../model/postModel");
const Comment = require("../model/commentModel");
const  { buildCommentTree } = require("../utils/buildCommentTree");

//posting
const createPost = asyncHandler(async (req,res)=>{
    const {title,text} = req.body;
    const userId = req.user.id;

    if(!title || !text ){
        res.status(400);
        throw new Error("Please fill the fields");
    }

    try{
        const newPost = await Post.create({
            user:userId,
            title,
            text,
            upvotedBy: [],
            downvotedBy: [],
        });
        res.status(201).json({
            success:true,
            data:newPost,
        });
        console.log("Post created by:", userId);
    }catch(error){
        console.log("Error creating Post:",error.message);
        res.status(500);
        throw new Error("Post creation failed");
    }
});

const deletePost = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const post = await Post.findById(id);

    if(!post){
        console.error("Post not found")
        return res.status(404).json({message:"Post not found"})
        // res.status(400);
        // throw new Error("Post not found");
    }
    if(post.user?.toString() !== req.user.id && req.user.role !== "admin"){
        console.error("User not authorized");
        return res.status(401).json({message:"User not authorized"});
        // throw new Error("User not authorized");
    }

    await Comment.deleteMany({post:id})
    await Post.findByIdAndDelete(id);
    res.status(200).json({message:"Post Deleted"});
});

const updatePost = asyncHandler(async(req,res)=>{
    const {postId} = req.params;
    const post = await Post.findById(postId);

    if(!post){
        console.log("post not found");
        res.status(404);
        throw new Error("Post not found");
    }
    if(req.user.id !== post.user.toString() && req.user.role !== "admin"){
        res.status(500);
        throw new Error("Not authorized to update this post");
    }
    
    const {title,text} = req.body;
    if(!title && !text){
        res.status(400);
        throw new Error("Please fill the fields");
    }
    if(title !== undefined)
        post.title = title;
    if(text !== undefined)
        post.text = text;
    const updatedPost = await post.save();
    res.status(200).json({
        message:"Post edited",
        post:updatedPost
    });
});

//likes and dislikes
const likePost = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if(!post){
        console.log("Post Not Found");
        res.status(400).json({message:"Post not found"});
        // throw new Error("Post not found");
    }

    if(post.upvotedBy.includes(userId)){
        post.upvotedBy.pull(userId);
    }else{
        post.upvotedBy.push(userId);
        post.downvotedBy.pull(userId);
    }
    await post.save();

    res.status(200).json({
        message:"Post liked/unliked",
        upvotes:post.upvotedBy.length,
        downvotes:post.downvotedBy.length,
    });
});


const disLikePost = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if(!post){
        console.error("Post not found");
        res.status(400).json({message:"Post(s) not found"});
    }
    if (post.downvotedBy.includes(userId)) {
        post.downvotedBy.pull(userId);
    } else {
        post.downvotedBy.push(userId);
        post.upvotedBy.pull(userId);
    }

    await post.save();
    res.status(200).json({
        message: "Post disliked/undisliked",
        upvotes: post.upvotedBy.length,
        downvotes: post.downvotedBy.length,
    });
});

//all liked post liked by specific user
const getLikedPost = asyncHandler(async (req, res) => {
    const requestedUserId = req.params.userId;
    const loggedInUserId = req.user._id.toString();

    // console.log("Requested User ID:", requestedUserId);
    // console.log("Logged In User ID:", loggedInUserId);
    // console.log("Role:", req.user.role);

    if (loggedInUserId !== requestedUserId && req.user.role !== "admin") {
        res.status(403).json({ message: "Not authorized" });
        throw new Error("Not authorized to access this user's liked posts");
    }

    const likedPost = await Post.find({ upvotedBy: requestedUserId })
        .sort("-createdAt")
        .populate("user");

    if (!likedPost || likedPost.length === 0) {
        res.status(400).json({ message: "No liked posts found" });
        return;
    }

    res.status(200).json(likedPost);
});

const getDisLikedPost = asyncHandler(async(req,res)=>{
    const requestedUserId = req.params.userId;
    const loggedInUserId = req.user._id;

    if(loggedInUserId.toString() !== requestedUserId && req.user.role !== "admin"){
        res.status(403).json({message:"Not authorized"});
        // throw new Error("Not Authorized");
        console.error("Not Authorized");
    }

    const dislikedPost = await Post.find({downvotedBy:requestedUserId}).sort("-createdAt").populate("user");

    if(!dislikedPost || dislikedPost.length === 0){
        res.status(404).json({message:"disliked post not found"});
        // throw new Error("Disliked post not found");
        console.log("Disliked post not found");
    }

    res.status(200).json(dislikedPost);
});


//get all post
const getallPost = asyncHandler(async (req, res) => {
    const posts = await Post.find({})
        .sort("-createdAt")
        .populate("user", "name email");

    res.status(200).json({
        success: true,
        count: posts.length,
        data: posts,
    });
});

//views count , logic when user click on the post views count increase
    const getViewsCount = asyncHandler(async(req,res)=>{
        const { postId } = req.params;
        const loggedInUserId = req.user._id;

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({message:"Post not found"});
        }
        if(post.user.toString() !== loggedInUserId.toString()){
            post.views += 1;
            await post.save();
        }

        res.status(200).json({success:true,views:post.views});
    });

// get post posted by the user
const getAllPostByUser = asyncHandler(async(req,res)=>{
    const requestedUserId = req.params.userId;
    const loggedInUserId = req.user._id;

    const post = await Post.find({user:loggedInUserId}).sort("-createdAt").populate("user");

    if(requestedUserId.toString() !== loggedInUserId.toString() && req.user.role !== "admin"){
        res.status(403).json({message:"Not authorized to access users all post"})
        // throw new Error("Not authorized to access users all post");
    }

    if(!post || post.length === 0){
        res.status(404).json({message:"No post found of this user"});
    }

    res.status(200).json(post);
});

//comments
const createComment = asyncHandler(async(req,res)=>{
    const user = req.user?.id;
    const post = req.params.postId;
    const {text,parent=null} = req.body;

    if(!user){
        console.log("User not logged in");
        res.status(500);
        throw new Error("Please login to comment");
    }
    if(!post){
        console.log("Post not found");
        res.status(400);
        throw new Error("Post not found");
    }

    try{
        const newComment = new Comment({user,post,text,parent});
        await newComment.save();

        res.status(201).json(newComment);
    }catch(error){
        console.log("Error in commenting",error);
        res.status(500).json({message:"Server error,empty text area!!"});
    }
});

const editComment = asyncHandler(async(req,res)=>{
    const { commentId } = req.params;
    const { text } = req.body;
    const comment = await Comment.findById(commentId);

    if(!comment){
        res.status(404).json({message:"comment is not found"});
    }
    try{
        comment.text = text;
        const updated = await comment.save();
        res.status(201).json({message:"comment updated",updated});
    }catch(error){
        console.log("Error in editing comment");
        // throw new Error(error);
        res.status(500).json({message:"Internal server error"});
    }
});

//comments by user
const getAllCommentsByUser = asyncHandler(async(req,res)=>{
    const requestedUserId = req.params.userId;
    const loggedInUserId = req.user._id;

    if(loggedInUserId.toString() !== requestedUserId && req.user.role !== "admin"){
        return res.status(403),json({message:"Not authorized to access all comments"});
        // throw new Error("Not authorized to access all comments");
    }
    const comments = await Comment.find({user:requestedUserId})
        .sort("-createdAt")
        .populate("user","name email")
        .populate("post","title _id")
        .lean();

    if(!comments || comments.length === 0){
        return res.status(200).json({message:"No Comments found"});
    }
    res.status(200).json(comments);
});

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params;
    const comment = await Comment.findById(commentId);

    if(!comment){
        console.log("Comment not found");
        res.status(400);
        throw new Error("Comment not found");
    }
    //comment user is equal to logged in user
    if(comment.user?.toString() !== req.user.id && req.user.role !== "admin"){
        res.status(401);
        throw new Error("User not authorized");
    }
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({message:"Post Deleted"});
});

const getComments = asyncHandler(async(req,res)=>{
    const postId = req.params.postId;
    const post = await Post.findById(postId);
    if(!post){
        return res.status(404).json({message:"Post got deleted or not found"});
    }
    try{
        const comments = await Comment.find({
            post:postId,
            parent:null,
        })
        .sort("-createdAt")
        .populate("user", "name email")
        .lean();
        console.log("top-level Comments fetched");
        res.status(201).json(comments);
    }catch(error){
        console.log("Error in fetching top-level comments");
        res.status(500).json({message:"Failed to fetch comments"});
    }
});

//allcomments
const getAllComments = asyncHandler(async (req, res) => {
  try {
    const comments = await Comment.find()
      .sort("-createdAt")
      .populate("user", "name email")
      .populate("post", "title _id")
      .lean();

    console.log("All comments fetched");
    res.status(200).json({
      message: "All Comments fetched",
      data: comments,
    });
  } catch (error) {
    console.error("Error in fetching all comments", error.message);
    res.status(500).json({ message: "Failed to fetch all comments" });
  }
});


// nested-reply
const getNestedComments = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  try {
    const rootComment = await Comment.findById(commentId).lean();
    if (!rootComment) {
      return res.status(404).json({ message: "Root comment not found" });
    }

    const postId = rootComment.post;

    const allComments = await Comment.find({ post: postId })
      .populate("user", "name email")
      .lean();

    res.status(200).json(allComments);
  } catch (error) {
    console.error("Failed to fetch nested comments", error);
    res.status(500).json({ message: "Error fetching nested comments" });
  }
});

//reply
const postReply = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const user = req.user?.id;
    if (!text) {
        console.log("Reply text is empty");
        return res.status(400).json({ message: "Reply text is empty" });
    }
    if (!commentId) {
        console.log("Comment ID is missing");
        return res.status(400).json({ message: "Comment ID is missing" });
    }
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        console.log("Comment not found");
        return res.status(404).json({ message: "Comment not found" });
    }
    try {
        const newReply = new Comment({
            user,
            post: parentComment.post,
            text,
            parent: commentId
        });

        await newReply.save();
        res.status(201).json(newReply);
    } catch (error) {
        console.log("Error in posting reply", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//edit reply
const editReply = asyncHandler(async(req,res)=>{
    const { replyId } = req.params;
    const { replyText } = req.body;
    
    const reply = await Comment.findById(replyId);
    
    if(!reply){
        return res.status(404).json({message:"Reply is not found"});
    }
    try{
        reply.text = replyText;
        const updatedReply = await reply.save();
        console.log("Successfully edited the reply");
        res.status(200).json({message:"Successfully edited the reply",updatedReply});
    }catch(error){
        console.error("Error in editing reply",error);
        res.status(500).json({message:"Internal server error"});
    }
});

//delete reply
const deleteReply = asyncHandler(async(req,res)=>{
    const {replyId} = req.params;
    const reply = await Comment.findById(replyId);

    if(!reply){
        console.log("Reply not found");
        res.status(400);
        throw new Error("Reply not found");
    }

    if(reply.user?.toString() !== req.user.id && req.user.role !== "admin"){
        res.status(400);
        throw new Error("User not authorized");
    }
    await Comment.findByIdAndDelete(replyId);
    res.status(200).json({message:"Reply Deleted"});
});

//get all replies
const allReplies = asyncHandler(async(req,res)=>{
    try{
        const replies = await Comment.find({ parent:{$ne:null} })
        .sort("-createdAt")
        .populate("user","name email")
        // .populate("comment","title _id")
        .populate("parent","text _id")
        .lean();

        console.log("All replies fetched")
        res.status(200).json({
            message:"All Replies fetched",
            data:replies,
        });
    }catch(error){
        console.error("Error in fetching all replies", error.message);
        res.status(500).json({ message: "Failed to fetch all replies" });
    }
});

// const getAllComments = asyncHandler(async (req, res) => {
//   try {
//     const comments = await Comment.find()
//       .sort("-createdAt")
//       .populate("user", "name email")
//       .populate("post", "title _id")
//       .lean();

//     console.log("All comments fetched");
//     res.status(200).json({
//       message: "All Comments fetched",
//       data: comments,
//     });
//   } catch (error) {
//     console.error("Error in fetching all comments", error.message);
//     res.status(500).json({ message: "Failed to fetch all comments" });
//   }
// });

//post by id
const getPostById = asyncHandler(async(req,res)=>{
    const {postId} = req.params;
    const post = await Post.findById(postId).populate("user","name");
    if(!post){
        console.log("Post not found");
        res.status(400);
        throw new Error("Post not found");
    }
    res.status(200).json(post);
});


module.exports = {
    createPost,
    deletePost,
    likePost,
    disLikePost,
    getallPost,
    createComment,
    getComments,
    getNestedComments,
    deleteComment,
    editComment,
    postReply,
    deleteReply,
    getPostById,
    updatePost,
    getAllPostByUser,
    getAllCommentsByUser,
    getLikedPost,
    getDisLikedPost,
    getViewsCount,
    editReply,
    getAllComments,
    allReplies,

};