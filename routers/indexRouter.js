const express = require("express");
const indexRouter = express.Router();
const {ServeIndex} = require("../controllers/IndexController");

// base route
indexRouter.get("/",ServeIndex);

module.exports = indexRouter;