const express = require("express");
const usersRouter = express.Router();
const {GetAllUsers} = require("../controllers/UsersController");

usersRouter.get("/",GetAllUsers);

module.exports = usersRouter;