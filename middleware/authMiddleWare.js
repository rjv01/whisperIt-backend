const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../model/UserModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // res.status(401);
    console.log("Not authorized(auth), please login");
    res.status(401).json({message:"Not authorized, please login"});
    // throw new Error("Not authorized, please login");
  }

  try {

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(verified.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({message:"Please login"});
    throw new Error("Token is invalid or Session expired. Please login again.");
  }
});

const isAdmin = (req,res,next)=>{
  if(req.user && req.user.role === "admin"){
    next();
  }else{
    res.status(403);
    throw new Error("Access denied. You are not an admin");
  }
};

module.exports = { protect, isAdmin };
