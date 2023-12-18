const User = require("../models/User");
const passport = require("passport");
const verifyAuth = require("../services/verifyAuth");
const UserRepo = require("../repos/userRepo");

// instantiate UserRepo
const _userRepo = new UserRepo();

// middleware to render registration form
exports.RegistrationForm = (req, res, next) => {
  // check if user is even logged in, if not redirect to login
  const authInfo = verifyAuth(req);
  const isAuthenticated = authInfo.authenticated;
  if (isAuthenticated) {
    // placeholder
    return res.send("logout first");
  }
  res.status(201).render("register", {
    title: "Express Billing Project: Register",
    errorMsg: "",
    newUser: {},
    authInfo: authInfo,
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
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  };

  // check if passwords don't match
  if (password !== confirmPassword) {
    return res.render("register", {
      title: "Express Billing Project: Register",
      errorMsg: "Passwords Don't Match!",
      newUser: newUser,
      authInfo: verifyAuth(req),
    });
  }
  // else register user
  User.register(new User(newUser), password, (err, user) => {
    if (err) {
      let errorMsg = "";
      if (err.code === 11000) {
        errorMsg = "Error Registering : Email or username already exists!";
      } else {
        console.log(err.message);
        errorMsg = "Error Registering : Please try again!";
      }
      // render login page again
      res.render("register", {
        title: "Express Billing Project: Register",
        errorMsg: errorMsg,
        newUser: newUser,
        authInfo: verifyAuth(req),
      });
    } else {
      // login user
      passport.authenticate("local", (err, user) => {
        if (err) {
          // invoke error handling middleware
          return next(err);
        } else {
          req.login(user, async (err) => {
            if (err) {
              // invoke error handling middleware
              return next(err);
            } else {
              // get user roles and attach those to session object
              const data = await _userRepo.getUserDetails(user.username, ["roles"]);
              let sessionData = req.session;
              sessionData.roles = data.roles;
              // redirect to userpage
              return res.redirect("/auth/user");
            }
          });
        }
      })(req, res, next);
    }
  });
};

// middleware to render login form
exports.LoginForm = (req, res, next) => {
  const authInfo = verifyAuth(req);
  const isAuthenticated = authInfo.authenticated;
  if (isAuthenticated) {
    // placeholder
    return res.send("logout first");
  }
  // retrieve error flash message (if available)
  const errorMessage = req.flash("error");
  res.status(201).render("login", {
    title: "Express Billing Project: Login",
    errorMsg: errorMessage,
    authInfo: verifyAuth(req),
  });
  next();
};

// middleware to handle login requests
exports.LoginUser = (req, res, next) => {
  const authInfo = verifyAuth(req);
  const isAuthenticated = authInfo.authenticated;
  if (isAuthenticated) {
    return res.send("logout first");
  }
  passport.authenticate("local", (err, user) => {
    if (err) {
      // send to error handling middleware
      return next(err);
    }
    if (!user) {
      // authentication failure (invalid username or password)
      req.flash("error", "Invalid username or password");
      return res.redirect("/auth/login");
    }
    req.login(user, async (err) => {
      // handle session related errors
      if (err) {
        return next(err);
      }
      // get user roles and attach those to session object
      const data = await _userRepo.getUserDetails(user.username, ["roles"]);
      let sessionData = req.session;
      sessionData.roles = data.roles;
      // redirect to userpage
      return res.redirect("/auth/user");
    });
  })(req, res, next);
};

// middleware to logout user
exports.LogoutUser = (req, res) => {
  // check if user is even logged in, if not redirect to login
  const authInfo = verifyAuth(req);
  const isAuthenticated = authInfo.authenticated;
  if (!isAuthenticated) {
    return res.redirect("/auth/login");
  }
  // logout
  req.logout((err) => {
    if (err) {
      // logout failure
      req.flash("error", "Unable to logout!");
      console.log(err.message);
      return res.redirect("/auth/user");
    }
    // redirect to index
    return res.redirect("/");
  });
};

// middleware to render user home page
exports.UserProfile = async (req, res, next) => {
  // check if user is even logged in, if not redirect to login
  const authInfo = verifyAuth(req);
  const isAuthenticated = authInfo.authenticated;
  if (!isAuthenticated) {
    return res.redirect("/auth/login");
  }
  const username = authInfo.username;
  // populate userDetails
  const userDetails = await _userRepo.getUserDetails(username, [
    "username",
    "email",
    "firstName",
    "lastName",
  ]);
  console.log(authInfo);
  // render user home page
  res.render("secure/user/dashboard", {
    title: "Express Billing Project: User Info",
    user: userDetails,
    authInfo: authInfo,
  });
  next();
};
