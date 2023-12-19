const User = require("../models/User");
const verifyAuth = require("../services/verifyAuth");
const UserRepo = require("../repos/userRepo");

// instantiate UserRepo
const _userRepo = new UserRepo();

exports.GetAllUsers = async (req, res, next) => {
    const rolesPermitted = ["admin", "manager"];
    // get authInfo
    const authInfo = verifyAuth(req, rolesPermitted);
    // check if the user is authenticated
    if (authInfo.authenticated) {
        // check if user can access this request
        if (authInfo.rolePermitted) {
            let query;
            // if yes, show all users to admin and only clients to managers
            if (authInfo.roles.includes("admin")) {
                query = await _userRepo.getAllUsers();
            } else if (authInfo.roles.includes("manager")) {
                query = await _userRepo.getAllClients();
            }
            // assign query results to users array
            const users = query ? query : [];
            // render listUsers view
            return res.render("secure/managers/listUsers", {
                title: "Express Billing Project: User List",
                authInfo: authInfo,
                users: users,
            });
        } else {
            return res.redirect("/auth/user");
        }
    } else {
        return res.redirect("/auth/login");
    }
};
