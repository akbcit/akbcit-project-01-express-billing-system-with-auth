const User = require("../models/User");

// middleware to render registration form
exports.RegistrationForm = (req, res, next) => {
  res.status(201).render("register", {
    title: "Express Billing Project: Register",
    errorMsg: "",
    newUser: {},
  });
  next();
};

// middleware to register user
exports.RegisterUser = (req, res, next) => {
  // check if passwords match
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  // create a newUser object
  const newUser = {
    username: req.body.username,
    email: req.body.email,
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password:password
  };
  // check if passwords don't match
  if (password !== confirmPassword) {
    res.render("register", {
      title: "Express Billing Project: Register",
      errorMsg: "Passwords Don't Match!",
      newUser: newUser,
    });
    next();
  }
  // else register user
  User.register(newUser, password, (err, user) => {
    // if error, reRender page with error message
    if (err) {
      res.render("register", {
        title: "Express Billing Project: Register",
        errorMsg: err.message,
        newUser: newUser,
      });
    }
    else{
        // login user
        res.send("registered!");
    }
  });
};
