const User = require("../models/User");
const verifyAuth = require("../services/verifyAuth");
const UserRepo = require("../repos/userRepo");
const isPasswordSecure = require("../services/isPasswordSecure");

// instantiate UserRepo
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
            // retreive message, if any from req.flash
            const errorMessage = req.flash("error")[0];
            const successMessage = req.flash("success")[0];
            let query;
            // if yes, show all users to admin and non-admin,non-managers to managers
            if (authInfo.roles.includes("admin")) {
                query = await _userRepo.getAllUsers();
            } else if (authInfo.roles.includes("manager")) {
                const excludedRoles = ['admin', 'manager'];
                query = await _userRepo.getAllUsers({
                    $or: [
                        { roles: { $size: 0 } },
                        { roles: { $exists: false } },
                        { roles: { $nin: excludedRoles } }
                    ]
                });
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
            console.log(username);
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
exports.CreateUserForm = (req, res, next) => {
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
            // render form
            return res.render("secure/admins/userCreate", {
                title: "Express Billing Project: Create User",
                authInfo: authInfo,
                user: {},
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
                clientDetails: {
                    isClient: req.body.isClient === "on" ? true : false,
                    code: req.body.clientCode,
                    company: req.body.company,
                },
            };
            // check if passwords match
            if (req.body.password !== req.body.confirmPassword) {
                const errorMessage =
                    "Passwords don't match!";
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
                const errorMessage =
                    "Password does not meet securtiy requirements!";
                // render create form
                return res.render("secure/admins/userCreate", {
                    title: "Express Billing Project: Create User",
                    authInfo: authInfo,
                    user: newUser,
                    message: { error: errorMessage },
                });
            }
            // validation if isClient is unchecked but client details were submitted
            if (
                !newUser.clientDetails.isClient &&
                (newUser.clientDetails.code || newUser.clientDetails.company)
            ) {
                const errorMessage =
                    "Please check 'Is Client' if you want to add Client details!";
                // render create form
                return res.render("secure/admins/userCreate", {
                    title: "Express Billing Project: Create User",
                    authInfo: authInfo,
                    user: newUser,
                    message: { error: errorMessage },
                });
            } else {
                // send newUser to repo
                const response = await _userRepo.createUser(newUser,req.body.password);
                if (response.includes("Error")) {
                    // render create form
                    return res.render("secure/admins/userCreate", {
                        title: "Express Billing Project: Create User",
                        authInfo: authInfo,
                        user: newUser,
                        message: { error: `${response}: Please ensure unique username, email and only alphabets in name!` },
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
            // create an editedUser object from form data
            const editedUser = {
                username: req.body.username,
                email: req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                roles: req.body.roles ? req.body.roles.split(",") : [],
                clientDetails: {
                    isClient: req.body.isClient === "on" ? true : false,
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
            console.log(response);
            if (response.includes("Error")) {
                // render the form agan with error
                const errorMessage = response;
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
                req.flash("success", response);
                return res.redirect(`/users/${req.body.username}`);
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
                    req.flash("success", `${username}'s account deleted successfully!`);
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
