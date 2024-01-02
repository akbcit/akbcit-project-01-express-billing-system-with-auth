const User = require("../models/User");
const passport = require("passport");
const verifyAuth = require("../services/verifyAuth");
const UserRepo = require("../repos/userRepo");
const ClientRepo = require("../repos/clientRepo");
const isPasswordSecure = require("../services/isPasswordSecure");

// instantiate UserRepo and ClientRepo
const _userRepo = new UserRepo();
const _clientRepo = new ClientRepo();

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
  User.register(new User(newUser), password, async (err, user) => {
    if (err) {
      let errorMsg = "";
      if (err.code === 11000) {
        errorMsg = "Error Registering : Email or username already exists!";
      } else {
        console.log(err.message);
        errorMsg =
          "Error Registering : Please try again and ensure unique username and email!";
      }
      // render register page again
      res.render("register", {
        title: "Express Billing Project: Register",
        errorMsg: errorMsg,
        newUser: newUser,
        authInfo: verifyAuth(req),
      });
    } else {
      // check if a client exists with this email
      const clientDoc = await _clientRepo.getClientByEmail(newUser.email);
      // if yes update the client's username, name and add clientID to user
      clientDoc.username = newUser.username;
      clientDoc.firstName = newUser.firstName;
      clientDoc.lastName = newUser.lastName;
      await clientDoc.save();
      const userDoc = await _userRepo.getUserByEmail(newUser.email);
      userDoc.clientId = clientDoc._id;
      await userDoc.save();
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
    editMode: false,
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

exports.SelfEdit = async (req, res) => {
  // check auth status
  const authInfo = verifyAuth(req);
  if (authInfo.authenticated) {
    // get form data
    const editedDetails = {
      username: req.body.username,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };
    // get user's current details to be used for cascading later
    const currUserDoc = await _userRepo.getUserByUsername(authInfo.username);
    // send to repo for update
    const username = authInfo.username;
    const response = await _userRepo.editUser(username, editedDetails);
    if (!response) {
      return res.render("secure/users/dashboard", {
        title: "Express Billing Project: User Info",
        user: editedDetails,
        authInfo: authInfo,
        message: {
          error:
            "Error saving! Please ensure unique username and email and try again!",
        },
        editMode: true,
      });
    }
    // invoke inUpdate cascade to update client details if user is a client too
    const newUserDoc = response;
    await _userRepo.onUpdateCascadeClient(
      currUserDoc,
      newUserDoc
    );
    // if username changed login again automatically
    if (username !== editedDetails.username) {
      console.log(`new username: ${editedDetails.username}`);
      req.user = await _userRepo.getUserByUsername(editedDetails.username);
      req.login(req.user, async (err) => {
        if (err) {
          console.log(err);
        } else {
          // get user roles and attach those to session object
          let sessionData = req.session;
          sessionData.roles = req.user.roles;
          req.flash("success", "Updated details saved successfully!");
          return res.redirect("/auth/user");
        }
      });
    } else {
      req.flash("success", "Updated details saved successfully!");
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
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
        if (!isPasswordSecure(newPassword)) {
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
    return res.redirect("/auth/login");
  }
};
