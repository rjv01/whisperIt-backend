const express = require("express");
const router = express.Router();

const {protect, isAdmin} = require("../middleware/authMiddleWare");
const{
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

} = require("../controllers/postCtr");

router.post("/createpost",protect,createPost); //done

//also for admin
router.delete("/deletepost/:id",protect,deletePost); //done
router.patch("/updatepost/:postId",protect,updatePost); // done

//like and dislike post
router.post("/likepost/:id",protect,likePost); // done
router.post("/dislikepost/:id",protect,disLikePost); //done

//specific user liked/disliked post, for admin too
router.get("/getlikedpost/:userId",protect,getLikedPost); //done
router.get("/getdislikedpost/:userId",protect,getDisLikedPost); //done

//get all post home
router.get("/allpost",getallPost); //done


//views count
router.patch("/viewscount/:postId",protect,getViewsCount); // done

//post/delete comment
router.post("/comment/:postId",protect,createComment); //done
router.delete("/deletecomment/:commentId",protect,deleteComment); //done

//get comments of the post
router.get("/getcommets/:postId",getComments); //done
router.get("/getNestedComments/:commentId", getNestedComments); //not yet
router.patch("/editcomment/:commentId",protect,editComment); //done


router.post("/postreply/:commentId",protect,postReply); //done
router.delete("/deletereply/:replyId",protect,deleteReply); // done
router.patch("/editreply/:replyId",protect,editReply); // done
router.get("/getallreplies",allReplies); //doing
//get all posts by user
router.get("/getallpostbyuser/:userId",protect,getAllPostByUser); //done

// all comments and replies will be shown here
router.get("/getallcommentsbyuser/:userId",protect,getAllCommentsByUser); //done
router.get("/allcomments",protect,getAllComments);

// router.get("/getallrepliesbyuser/:userid",protect,getAllRepliestByUser);

// getPostById
router.get("/getpostbyid/:postId",getPostById); //done

module.exports = router;