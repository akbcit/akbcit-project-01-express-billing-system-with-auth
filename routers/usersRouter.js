const express = require("express");
const usersRouter = express.Router();
const {GetAllUsers,DeleteUser,UserDetails,EditUserForm,EditUser} = require("../controllers/UsersController");

// define CRUD routes
usersRouter.get("/",GetAllUsers);
usersRouter.get("/:username/delete",DeleteUser);
usersRouter.get("/:username/edit",EditUserForm);
usersRouter.post("/:username/edit",EditUser);
usersRouter.get("/:username",UserDetails);

module.exports = usersRouter;