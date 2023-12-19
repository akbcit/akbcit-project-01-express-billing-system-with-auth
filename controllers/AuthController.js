const User = require("../models/User");
const passport = require("passport");
const verifyAuth = require("../services/verifyAuth");
const UserRepo = require("../repos/userRepo");
const isPasswordSecure = require("../services/isPasswordSecure");

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
  // check if password is secure
  if (!isPasswordSecure(password)) {
    return res.render("register", {
      title: "Express Billing Project: Register",
      errorMsg: "Password failed security requirements!",
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
              const data = await _userRepo.getUserDetails(user.username, [
                "roles",
              ]);
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
  // retreive message, if any from req.flash
  const errorMessage = req.flash("error")[0];
  const successMessage = req.flash("success")[0];
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
  res.render("secure/users/dashboard", {
    title: "Express Billing Project: User Info",
    user: userDetails,
    authInfo: authInfo,
    message: errorMessage
      ? { error: errorMessage }
      : successMessage
      ? { success: successMessage }
      : {},
  });
  next();
};

// middleware for reset password form
exports.PasswordResetForm = (req, res, next) => {
  // check auth status
  const authInfo = verifyAuth(req);
  // if autheticated send the form
  if (authInfo.authenticated) {
    res.status(201).render("secure/users/reset-password", {
      title: "Express Billing Project: Password Reset",
      authInfo: authInfo,
      errorMsg: "",
    });
  } else {
    res.redirect("/auth/login");
  }
  next();
};

// middleware for resetting password
exports.PasswordReset = async (req, res, next) => {
  // check auth status
  const authInfo = verifyAuth(req);
  // if authenticated, send the form
  if (authInfo.authenticated) {
    // get data from the form
    const currPassword = req.body.currentPassword;
    const newPassword = req.body.newPasswordReset;
    const newPasswordConfirm = req.body.confirmPasswordReset;
    console.log(newPassword);
    const username = authInfo.username;
    // get user using username
    try {
      const user = await _userRepo.getUserByUsername(username);
      if (!user) {
        return res.status(404).render("secure/users/reset-password", {
          title: "Express Billing Project: Password Reset",
          authInfo: authInfo,
          errorMsg: "Error getting user details from the database",
        });
      }

      // check if current password matches
      user.authenticate(currPassword, async (err, user) => {
        if (err || !user) {
          return res.status(401).render("secure/users/reset-password", {
            title: "Express Billing Project: Password Reset",
            authInfo: authInfo,
            errorMsg: "Current Password is incorrect!",
          });
        }
        // check if new password and confirmation match
        if (newPassword !== newPasswordConfirm) {
          return res.status(400).render("secure/users/reset-password", {
            title: "Express Billing Project: Password Reset",
            authInfo: authInfo,
            errorMsg: "Passwords do not match!",
          });
        }
        // check if password is secure
        if (!isPasswordSecure(password)) {
          return res.status(400).render("secure/users/reset-password", {
            title: "Express Billing Project: Password Reset",
            authInfo: authInfo,
            errorMsg: "New password failed security requirements",
          });
        }
        // reset password
        try {
          // passport-local-mongoose method to set new password
          await user.changePassword(currPassword, newPassword);
          req.flash("success", "Password changed successfully!");
          return res.redirect("/auth/user");
        } catch (err) {
          console.error(`Error changing password: ${err.message}`);
          return res.status(500).render("secure/users/reset-password", {
            title: "Express Billing Project: Password Reset",
            authInfo: authInfo,
            errorMsg: "Internal error, please try again!",
          });
        }
      });
    } catch (err) {
      console.error(`Error getting user from the database: ${err.message}`);
      return res.status(404).render("secure/users/reset-password", {
        title: "Express Billing Project: Password Reset",
        authInfo: authInfo,
        errorMsg: "Error getting user details from the database",
      });
    }
  } else {
    res.redirect("/auth/login");
  }
};
