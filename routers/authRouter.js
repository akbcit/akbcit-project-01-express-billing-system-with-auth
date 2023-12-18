const express = require("express");
const {RegistrationForm,RegisterUser,LoginForm,LoginUser,UserProfile,LogoutUser} = require("../controllers/AuthController");
const authRouter = express.Router();

// route for rendering registration form
authRouter.get("/register",RegistrationForm);

// route for registering user
authRouter.post("/register",RegisterUser);

// route for rendering login form
authRouter.get("/login",LoginForm);

// route for logging user in
authRouter.post("/login",LoginUser);

// route for user home
authRouter.get("/user",UserProfile);

// route for logging out
authRouter.get("/logout",LogoutUser);

module.exports = authRouter;