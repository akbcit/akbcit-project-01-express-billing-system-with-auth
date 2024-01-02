// import the respository class
const ClientRepo = require("../repos/clientRepo");
const UserRepo = require("../repos/userRepo");
const verifyAuth = require("../services/verifyAuth");

// initialise instances of the repos
const _clientRepo = new ClientRepo();
const _userRepo = new UserRepo();

// method to get all clients
exports.GetAllClients = async (req, res) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // check if there is any search phrase
      const searchPhrase = req.query.query ? req.query.query : "";
      // get clients list
      const clients = await _clientRepo.getAllClients(searchPhrase);
      // render clients list page
      res.render("secure/managers/listClients", {
        title: "Express Billing Project: Clients",
        authInfo: authInfo,
        clients: clients ? clients : [],
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

// method to get one client
exports.ClientDetails = async (req, res) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      const id = req.params.clientId;
      // get this client from repo
      const client = await _clientRepo.getClientById(id);
      // render client details page if client found
      if (client) {
        return res.render("secure/managers/clientDetails", {
          title: `Express Billing Project: Client ${id}`,
          authInfo: authInfo,
          customer: client,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        req.flash("error", "No such client found!");
        return res.redirect("/clients");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// method to render client create form
exports.CreateClientForm = async (req, res) => {
  const rolesPermitted = ["admin","manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // check of there is a username in url
      const username = req.query.username;
      const user = await _userRepo.getUserByUsername(username);
      let newClient = {};
      if (user) {
        newClient = {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
        };
      }
      // render form
      return res.render("secure/admins/clientCreate", {
        title: "Express Billing Project: Client Create",
        authInfo: authInfo,
        customer: newClient,
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

// method to create client
exports.CreateClient = async (req, res) => {
  const rolesPermitted = ["admin","manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get data from body and create an object
      const newClient = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        code: req.body.code,
        company: req.body.company,
      };
      // check if body also has a username, if yes add it
      if (req.body.username) {
        newClient.username = req.body.username;
      }
      // check if email already exists with a user
      const user = await _userRepo.getUserByEmail(req.body.email);
      if (user && user.username!==newClient.username) {
        let errorMessage = {};
        if (user.clientId) {
          errorMessage = `This email address already belongs to a User with username '${user.username}' and they are already set up as a client!`;
        } else {
          errorMessage = `This email address already belongs to a User with username '${user.username}'! If you want to add them as a client you can do so on the user's edit page`;
        }
        // render form again
        return res.render("secure/admins/clientCreate", {
          title: "Express Billing Project: Client Create",
          authInfo: authInfo,
          customer: newClient,
          message: {
            error: errorMessage,
          },
        });
      }
      // send to repo for creating client
      const response = await _clientRepo.createClient(newClient);
      if (response) {
        req.flash("success", "Client created successfully!");
        return res.redirect("/clients");
      } else {
        // render form again
        return res.render("secure/admins/clientCreate", {
          title: "Express Billing Project: Client Create",
          authInfo: authInfo,
          customer: newClient,
          message: {
            error:
              "Could not create client, Please ensure unique username and email, and only alphabets in name!",
          },
        });
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// method to render client edit form
exports.EditClientForm = async (req, res) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get client
      const clientId = req.params.clientId;
      const client = await _clientRepo.getClientById(clientId);
      if (client) {
        return res.render("secure/managers/clientEdit", {
          title: `Express Billing Project: Client ${clientId} Edit`,
          authInfo: authInfo,
          customer: client,
          message: errorMessage
            ? { error: errorMessage }
            : successMessage
            ? { success: successMessage }
            : {},
        });
      } else {
        req.flash("error", "No such client found");
        return res.redirect("/clients");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// method to edit client
exports.EditClient = async (req, res) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // create updatedClient object
      const updatedClient = {
        id: req.body.clientId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        code: req.body.code,
        company: req.body.company,
      };
      // get exisiting client (for onUpdateCascaseUser later)
      const currentDoc = await _clientRepo.getClientById(req.body.clientId);
      // check if email is not with some other user
      try {
        const user = await _userRepo.getUserByEmail(req.body.email);
        console.log(user);
        if ((!user.clientId) || (user.clientId !== req.body.clientId)) {
          return res.render("secure/managers/clientEdit", {
            title: `Express Billing Project: Client ${req.body.clientId} Edit`,
            authInfo: authInfo,
            customer: updatedClient,
            message: {
              error:
                "A user with this email exists! Please enter a different email.",
            },
          });
        }
      } catch (userEmailValidationError) {
        console.log(
          `Error while validating user email: ${userEmailValidationError}`
        );
      }
      // send to repo for updating
      console.log(`Sendng ${updatedClient} to repo`);
      const updatedDoc = await _clientRepo.updateClient(updatedClient);
      if (updatedDoc) {
        // on update cascasde user
        const onUpdateCascadeResponse = _clientRepo.onUpdateCascadeUser(
          currentDoc,
          updatedDoc
        );
        if (onUpdateCascadeResponse) {
          req.flash("success", "Client updated successfully!");
        } else {
          req.flash(
            "error",
            "Client updated successfully but failed to update client's User records!"
          );
        }
        return res.redirect("/clients");
      } else {
        return res.render("secure/managers/clientEdit", {
          title: `Express Billing Project: Client ${clientId} Edit`,
          authInfo: authInfo,
          customer: updatedClient,
          message: {
            error:
              "Error updating client, please ensure unique email, code and only alphabets in name.",
          },
        });
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// method to delete client
exports.DeleteClient = async (req, res) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get clientId
      const clientId = req.params.clientId;
      // send to repo for deletion
      const deletedDoc = await _clientRepo.deleteClient(clientId);
      if (deletedDoc) {
        // do on updateDelete
        const response = await _clientRepo.onDeleteCascadeUser(deletedDoc);
        if (response) {
          req.flash("error", "Client deleted successfully!");
          return res.redirect("/clients");
        } else {
          req.flash(
            "error",
            "Deleted client but could not update user records because of absence of user account or soem internal error. Please verify manually!"
          );
          return res.redirect("/clients");
        }
      } else {
        req.flash("error", "Could not find/delete client");
        return res.redirect("/clients");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};
