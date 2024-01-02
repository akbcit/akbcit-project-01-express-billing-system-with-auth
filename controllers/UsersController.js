const verifyAuth = require("../services/verifyAuth");
const ClientRepo = require("../repos/clientRepo");
const UserRepo = require("../repos/userRepo");
const isPasswordSecure = require("../services/isPasswordSecure");

// initialise instances of the repos
const _clientRepo = new ClientRepo();
const _userRepo = new UserRepo();

// middleware to get all users based on access level
exports.GetAllUsers = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if the user is authenticated
  if (authInfo.authenticated) {
    // check if user can access this request
    if (authInfo.rolePermitted) {
      // check if there is any search term
      const searchPhrase = req.query.query;
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      let query;
      // send an optional filter object depending on search
      let filterObj = {};
      if (searchPhrase) {
        filterObj = {
          $or: [
            { username: { $regex: searchPhrase, $options: "i" } },
            { lastName: { $regex: searchPhrase, $options: "i" } },
            { firstName: { $regex: searchPhrase, $options: "i" } },
            { roles: { $regex: searchPhrase, $options: "i" } },
            {
              "clientDetails.company": {
                $regex: searchPhrase,
                $options: "i",
              },
            },
          ],
        };
      }
      // if yes, show all users to admin and non-admin,non-managers to managers
      if (authInfo.roles.includes("admin")) {
        query = await _userRepo.getAllUsers(filterObj);
      } else if (authInfo.roles.includes("manager")) {
        const excludedRoles = ["admin", "manager"];
        // exlude admin and manager roles and include search filter if any
        filterObj = searchPhrase
          ? {
              $and: [
                {
                  $or: [
                    { username: { $regex: searchPhrase, $options: "i" } },
                    { lastName: { $regex: searchPhrase, $options: "i" } },
                    { firstName: { $regex: searchPhrase, $options: "i" } },
                    { roles: { $regex: searchPhrase, $options: "i" } },
                    {
                      "clientDetails.company": {
                        $regex: searchPhrase,
                        $options: "i",
                      },
                    },
                  ],
                },
                {
                  $or: [
                    { roles: { $size: 0 } },
                    { roles: { $exists: false } },
                    { roles: { $nin: excludedRoles } },
                  ],
                },
              ],
            }
          : {
              $or: [
                { roles: { $size: 0 } },
                { roles: { $exists: false } },
                { roles: { $nin: excludedRoles } },
              ],
            };
        query = await _userRepo.getAllUsers(filterObj);
      }
      // assign query results to users array
      const users = query ? query : [];
      // render listUsers view
      return res.render("secure/managers/listUsers", {
        title: "Express Billing Project: User List",
        authInfo: authInfo,
        users: users,
        message: errorMessage
          ? { error: errorMessage }
          : successMessage
          ? { success: successMessage }
          : {},
        isSearch: searchPhrase ? true : false,
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to get one user
exports.UserDetails = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // check authentication level
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if role permitted
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get username
      const username = req.params.username;
      // get user by username and send to view
      const user = await _userRepo.getUserByUsername(username);
      if (user) {
        res.render("secure/managers/userDetails", {
          title: `Express Billing Project: ${username} Details`,
          user: user,
          authInfo: authInfo,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        req.flash("error", `Could not find/load ${username}`);
        return res.redirect("/users");
      }
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to display Add user form
exports.CreateUserForm = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if role is permitted
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // check if there is a client id in query params
      const clientId = req.query.clientId;
      // if yes, retrieve this client
      let user = {};

      if (clientId) {
        // Retrieve client details from the repository
        const client = await _clientRepo.getClientById(clientId);

        // Populate the user object with client details
        user = {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          clientId: clientId,
        };
      }
      // render form
      return res.render("secure/admins/userCreate", {
        title: "Express Billing Project: Create User",
        authInfo: authInfo,
        user: user,
        message: errorMessage
          ? { error: errorMessage }
          : successMessage
          ? { success: successMessage }
          : {},
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to Create a new User
exports.CreateUser = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if role is permitted
    if (authInfo.rolePermitted) {
      // create a new user object
      const newUser = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        roles: req.body.roles ? req.body.roles.split(",") : [],
        isClient:
          req.body.isClient === "on" || req.body.isClient === "true"
            ? true
            : false,
      };
      // conditionally add clientID
      if (req.body.clientId !== undefined) {
        newUser.clientId = req.body.clientId;
      }
      // add code and company subproperties only if required
      if (req.body.clientCode !== undefined && req.body.company !== undefined) {
        newUser.clientCode = req.body.clientCode;
        newUser.clientCompany = req.body.company;
      }
      // check if email belongs to a client
      const client = await _clientRepo.getClientByEmail(newUser.email);
      if (client) {
        if(!newUser.clientId){
          const errorMessage =
          "This email belongs to a non-user client! If you want to add them as a user, you can do so through the client's details page.";
        // render create form
        return res.render("secure/admins/userCreate", {
          title: "Express Billing Project: Create User",
          authInfo: authInfo,
          user: newUser,
          message: { error: errorMessage },
        });
        }
      }
      // check if passwords match
      if (req.body.password !== req.body.confirmPassword) {
        const errorMessage = "Passwords don't match!";
        // render create form
        return res.render("secure/admins/userCreate", {
          title: "Express Billing Project: Create User",
          authInfo: authInfo,
          user: newUser,
          message: { error: errorMessage },
        });
      }
      // check if password meets security requirements
      if (!isPasswordSecure(req.body.password)) {
        const errorMessage = "Password does not meet securtiy requirements!";
        // render create form
        return res.render("secure/admins/userCreate", {
          title: "Express Billing Project: Create User",
          authInfo: authInfo,
          user: newUser,
          message: { error: errorMessage },
        });
      }
      // validation if isClient is unchecked but client details were submitted or vice versa
      if (!newUser.isClient && (newUser.clientCode || newUser.clientCompany)) {
        const errorMessage =
          "Please check 'Is Client' if you want to add Client details!";
        // render create form
        return res.render("secure/admins/userCreate", {
          title: "Express Billing Project: Create User",
          authInfo: authInfo,
          user: newUser,
          message: { error: errorMessage },
        });
      }
      // validation if isClient is checked but client details were not submitted
      if (
        !newUser.clientId &&
        newUser.isClient &&
        (!newUser.clientCode || !newUser.clientCompany)
      ) {
        const errorMessage =
          "Please provide client details if you want to set user as client!";
        // render create form
        return res.render("secure/admins/userCreate", {
          title: "Express Billing Project: Create User",
          authInfo: authInfo,
          user: newUser,
          message: { error: errorMessage },
        });
      } else {
        // send newUser to repo
        const response = await _userRepo.createUser(newUser, req.body.password);
        if (response.includes("Error")) {
          // render create form
          return res.render("secure/admins/userCreate", {
            title: "Express Billing Project: Create User",
            authInfo: authInfo,
            user: newUser,
            message: {
              error: `${response}: Please ensure unique username, email and only alphabets in name!`,
            },
          });
        } else {
          // add message to req.flash and render users page
          req.flash(
            "success",
            `New User: ${newUser.username} created successfully!`
          );
          return res.redirect("/users");
        }
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to display edit user form
exports.EditUserForm = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check auth status
  if (authInfo.authenticated) {
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get user from database
      const username = req.params.username;
      const user = await _userRepo.getUserByUsername(username);
      // if user exists
      if (user) {
        return res.render("secure/managers/userEdit", {
          title: `Express Billing Project: ${username} Edit`,
          authInfo: authInfo,
          user: user,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      }
      // if user does not exist
      else {
        req.flash("error", `Could not find / fetch ${username}`);
        return res.redirect("/users");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to Edit user details
exports.EditUser = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check auth status
  if (authInfo.authenticated) {
    // check if role is permitted
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get user from database
      const username = req.params.username;
      // get user's current details to be used for cascading later
      const currUserDoc = await _userRepo.getUserByUsername(username);
      if (!currUserDoc) {
        req.flash("error", "User not found!");
        return res.redirect(`/users`);
      }
      // create an editedUser object from form data
      const editedUser = {
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        roles: req.body.roles ? req.body.roles.split(",") : [],
        clientDetails: {
          isClient:
            req.body.isClient === "on" || req.body.isClient === "true"
              ? true
              : false,
          code: req.body.clientCode,
          company: req.body.company,
        },
      };
      // validation if isClient is unchecked but client details were submitted
      if (
        !editedUser.clientDetails.isClient &&
        (editedUser.clientDetails.code || editedUser.clientDetails.company)
      ) {
        const errorMessage =
          "Please check 'Is Client' if you want to add Client details!";
        return res.render("secure/managers/userEdit", {
          title: `Express Billing Project: ${username} Edit`,
          authInfo: authInfo,
          user: editedUser,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      }
      // else send the details to repo for update
      const response = await _userRepo.editUser(username, editedUser);
      if (!response) {
        // render the form agan with error
        const errorMessage = "Error updating, please ensure unique username, email!";
        return res.render("secure/managers/userEdit", {
          title: `Express Billing Project: ${username} Edit`,
          authInfo: authInfo,
          user: editedUser,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        // invoke inUpdate cascade to update client details if user is a client too
        const newUserDoc = response;
        const updatCascadeResponse = await _userRepo.onUpdateCascadeClient(
          currUserDoc,
          newUserDoc
        );
        if (updatCascadeResponse) {
          req.flash("success", "Details updated successfully!");
          return res.redirect(`/users/${req.body.username}`);
        } else {
          req.flash("error", "User Details updated successfully, but failed to update Client Records!");
        return res.redirect(`/users/${req.body.username}`);
        }
      }
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to delete one user
exports.DeleteUser = async (req, res, next) => {
  const rolesPermitted = ["admin"];
  // get authInfo
  const authInfo = verifyAuth(req, rolesPermitted);
  // check auth status
  if (authInfo.authenticated) {
    if (authInfo.rolePermitted) {
      // delete user
      const username = req.params.username;
      if (username === authInfo.username) {
        req.flash("error", "You can't delete your own account!");
        return res.redirect(`/users/${username}`);
      } else {
        const response = await _userRepo.deleteUser(username);
        if (response) {
          const deletedDoc = response;
          const cascadeRequestResponse = await _userRepo.onDeleteCascade(deletedDoc);
          if(cascadeRequestResponse){
            req.flash("success", `${username}'s account deleted successfully!`);
          }
          else{
            req.flash("error", `${username}'s account deleted successfully but failed to update client records!`);
          }
          return res.redirect("/users");
        } else {
          req.flash("error", `Unable to delete ${username}'s account!`);
          return res.redirect("/users");
        }
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};
