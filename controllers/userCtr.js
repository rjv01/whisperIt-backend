const asyncHandler = require("express-async-handler");
const User = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"1d"})
};

const registerUser = asyncHandler(async (req,res)=>{
    const {name,email,password} = req.body;

    if(!name || !email || !password ){
        // res.status(400);
        res.status(401).json({ message: "Please fill required fields" });
        // throw new Error("Please fill required fields");
    }
    
    const userExists = await User.findOne({email});
    if(userExists){
        // res.status(400);
        res.status(401).json({ message: "Email is already registered" });
        // throw new Error("Email is already registered");
    }

    const newUser = await User.create({
        name,
        email,
        password,
    });

    const token = generateToken(newUser._id);

    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires: new Date(Date.now()+1000 * 86400),
        sameSite:"none",
        secure:true,
    });

    if(newUser){
        const {_id,name,email} = newUser;
        console.log("User Registered");
        res.status(201).json({_id,name,email});
    }else{
        // res.status(400);
        res.status(401).json({ message: "Invalid user data" });
        throw new Error("Invalid user data");
    }
});

const updateUser = asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    const user = await User.findById(userId);

    if(!user){
        res.status(404);
        throw new Error("User not found");
    }

    if(req.user.id !== userId && req.user.role !== "admin"){
        res.status(500);
        throw new Error("Not authorized to edit this account");
    }
    const {name,password} = req.body;
    if(!name && !password){
        res.status(500);
        throw new Error("Please fill the fields");
    }
    if(name !== undefined)
        user.name = name;
    if(password !== undefined)
        user.password = password;
    const updatedUser = await user.save();

    res.status(200).json({
        message:"User Account edited",
        user:updatedUser
    })
});

//old
// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     // res.status(400);
//     res.status(401).json({ message: "Please add Email and Password" });
//     throw new Error("Please add Email and Password");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     // res.status(400);
//     res.status(401).json({ message: "User not found, Please Register" });
//     throw new Error("User not found, Please Register");
//   }

//   const matchedPassword = password === user.password; 

//   if (!matchedPassword) {
//     // res.status(400);
//     res.status(401).json({ message: "Invalid email or password" });
//     throw new Error("Invalid email or password");
//   }

//   const token = generateToken(user._id);

//   res.cookie("token", token, {
//     path: "/",
//     httpOnly: true,
//     expires: new Date(Date.now() + 1000 * 86400), 
//     sameSite: "none",
//     secure: true,
//   });

//   const { _id, name, role } = user; 

//   res.status(200).json({
//     message: "Login successful",
//     token,
//     user:{
//         _id,
//         name,
//         email,
//         role,
//         token,
//     },
//   });
// });

//new 
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ message: "Please add Email and Password" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: "User not found, Please Register" });
  }

  const matchedPassword = password === user.password; // In production, use bcrypt!

  if (!matchedPassword) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user._id);

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  const { _id, name, role } = user;

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      _id,
      name,
      email,
      role,
    },
  });
});

const adminLogin = asyncHandler(async(req,res)=>{
    const {email,password} = req.body;
    if(!email || !password){
        res.status(400);
        throw new Error("Please fill the fields");
    }
    const user = await User.findOne({email});
    if(!user){
        console.log("User not found");
        res.status(400);
        throw new Error("User not found")
    }
    if(user.role !== "admin"){
        res.status(400);
        throw new Error("Access denied:not an admin");
    }

    const matchedPassword = password === user.password; 

    if (!matchedPassword) {
        res.status(400);
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user._id);
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    });

    const { _id, name, role } = user;
    res.status(200).json({
        message: "Login successful",
        _id,
        name,
        email,
        role,
        token,
        });
    });

const logoutUser = asyncHandler(async (req,res)=>{
    res.cookie("token","",{
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    console.log("User Logged Out:");
    return res.status(200).json({ message: "Successfully Logged Out" });

});

const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.json(false);
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified) {
            return res.status(201).json(true,{message:req._id});
        }
    } catch (error) {
        console.log("JWT verification failed:", error.message);
        return res.json(false);
    }
    return res.json(true);
});

//delete user account
const deleteUserAccount = asyncHandler(async(req,res)=>{
    const {userId} = req.params;
    const user = await User.findById(userId);
    if(!user){
        console.log("User not found");
        res.status(404);
        throw new Error("User not found");
    }
    if(req.user.id !== userId && req.user.role !== "admin"){
        console.log("Not authorized to delete this account");
        res.status(400).json({message:"Not authorized to delete this account"});
        console.error("Not authorized to delete this account")
        // throw new Error("Not authorized to delete this account");
    }
    await User.findByIdAndDelete(userId);
    res.status(200).json({message:"Account deleted"});
});

//getAllUser
const getAllUser = asyncHandler(async(req,res)=>{
    const userList = await User.find({});

    if(!userList.length){
        return res.status(404).json({messgae:"No user found"});
    }

    res.status(200).json(userList);
});

//get user detail by id
const userDetail = asyncHandler(async(req,res)=>{
    const { userId } = req.params;
    const user = await User.findById(userId);

    if(!user){
        res.status(404).json({message:"user not found"});
        console.error("User not found");
        return ;
    }
    
    res.status(200).json({messgae:"User found",user});
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    loginStatus,
    adminLogin,
    getAllUser,
    deleteUserAccount,
    updateUser,
    userDetail,
}