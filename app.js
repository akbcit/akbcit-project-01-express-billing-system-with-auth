const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("express-flash");
const path = require("path");
const indexRouter = require("./routers/indexRouter");
const clientsRouter = require("./routers/clientsRouter");
const productsRouter = require("./routers/productsRouter");
const invoicesRouter = require("./routers/invoicesRouter");
const authRouter = require("./routers/authRouter");
const User = require("./models/User");

// use dotenv
require("dotenv").config();

// set up server
const app = express();

// set up logger
app.use(logger("dev"));

// allow cors
app.use(cors({ origin: [/127.0.0.1.*/, /localhost.*/] }));

// use bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express flash middleware
app.use(flash());

// connect to mongoDB
const uri = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(uri);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// setup session management
const secretKey = process.env.SECRET_KEY;
app.use(
  session({ secret: secretKey, resave: false, saveUninitialized: false })
);

// set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// view-engine and template setup
// set view engine and folder for views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// use ejs layouts and set default view as full-width
app.use(expressLayouts);
app.set("layout", "./layouts/full-width.ejs");
// use public folder for static files
app.use(express.static("public"));

// error handling middleware
app.use((err, req, res, next) => {
  // log the error for debugging purposes
  console.error(err);
  // render an error page using an EJS template
  res.status(500).render('error', { title:"Express Billing Project: Error",message: 'Internal Server Error' });
});

// use routers
app.use("/",indexRouter);
app.use("/clients",clientsRouter);
app.use("/products",productsRouter);
app.use("/invoices",invoicesRouter);
app.use("/auth",authRouter);

// start listening
const PORT = process.env.PORT || 3003;
app.listen(PORT,()=>{
    console.log(`Listening on PORT: ${PORT}`);
})

