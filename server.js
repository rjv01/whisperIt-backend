const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

//all routing collection
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");

app.use(cookieParser());
//old
// app.use(cors({
//   // origin: "http://localhost:5173",
//   origin: "https://whisper-it-frontend.vercel.app",
//   credentials: true,
// }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://whisper-it-frontend.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(bodyParser.json());


app.get("/raj",(req,res)=>{
    res.json({message:"Welcome Hello world"});
});


//routes middleware
app.use("/api/users",userRoute);
app.use("/api/blog",postRoute);

//connect to mongoose
mongoose
  .connect(process.env.DATABASE_CLOUD)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server Running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });