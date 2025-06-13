const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    logoutUser,
    loginStatus,
    adminLogin,
    getAllUser,
    deleteUserAccount,
    updateUser,
    userDetail,

} = require("../controllers/userCtr")
const { protect,isAdmin } = require("../middleware/authMiddleWare");

router.post("/register",registerUser); //done checked
router.post("/login",loginUser); //done checked
router.get("/logout",logoutUser); //done checked
router.get("/loggedin",loginStatus); //done checked

//also for admin
router.delete("/deleteuser/:userId",protect,deleteUserAccount); //done checked
router.patch("/updateuser/:userId",protect,updateUser); //done checked

//user details for admin and user
router.get("/userdetail/:userId",protect,userDetail); //done checked

//admin part
//login
router.post("/adminlogin",adminLogin); //done checked
// getAllUser
router.get("/getallusers",protect,isAdmin,getAllUser); //done checked

module.exports = router;