const express = require("express");
const {RegistrationForm,RegisterUser,LoginForm,LoginUser,UserProfile,LogoutUser,PasswordResetForm,PasswordReset,SelfEdit} = require("../controllers/AuthController");
const authRouter = express.Router();

// route for rendering registration form
authRouter.get("/register",RegistrationForm);

// route for registering user
authRouter.post("/register",RegisterUser);

// route for rendering login form
authRouter.get("/login",LoginForm);

// route for logging user in
authRouter.post("/login",LoginUser);

// route for password reset form
authRouter.get("/user/password-reset",PasswordResetForm);

// route for password reset
authRouter.post("/user/password-reset",PasswordReset);

// route for user home
authRouter.get("/user",UserProfile);

// route for self edit profile
authRouter.post("/user/edit",SelfEdit);

// route for logging out
authRouter.get("/logout",LogoutUser);

module.exports = authRouter;