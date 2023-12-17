const express = require("express");
const {RegistrationForm,RegisterUser} = require("../controllers/AuthController");
const authRouter = express.Router();

// route for rendering registration form
authRouter.get("/register",RegistrationForm);

// route for registering user
authRouter.post("/register",RegisterUser);

module.exports = authRouter;