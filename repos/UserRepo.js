const User = require("../models/User");
const Client = require("../models/Client");

class UserRepo {
  // method to fetch user details
  async getUserDetails(username, fieldsArray) {
    console.log(
      `Fetching details for ${fieldsArray} for user ${username} from the database!`
    );
    // create projection object
    const projection = fieldsArray.reduce(
      (proj, field) => ({ ...proj, [field]: 1 }),
      {}
    );
    // find user
    try {
      const userDetails = await User.findOne(
        { username: username },
        projection
      );

      if (userDetails) {
        console.log(userDetails);
        return userDetails;
      } else {
        return false;
      }
    } catch (err) {
      console.log(err.message);
      return false;
    }
  }
  // method to get user by username
  async getUserByUsername(username) {
    try {
      console.log(`Getting user: ${username} from database`);
      const user = await User.findOne({ username: username });
      return user;
    } catch (err) {
      console.log(`Unable to find user with username: ${username}`);
      return false;
    }
  }

  // method to get user by id
  async getUserById(id) {
    try {
      console.log(`Getting user: ${id} from database`);
      const user = await User.findById(id);
      return user;
    } catch (err) {
      console.log(`Unable to find user with id: ${id}`);
      return false;
    }
  }

  // method to get client details of a user who is a client
  async getUserByClientId(clientId) {
    try {
      console.log(`Getting user with clientId ${clientId} from database`);
      const user = await User.findOne({
        clientId: clientId,
      }).exec();
      return user;
    } catch (err) {
      console.log(`Unable to find user with clientId: ${clientId}`);
      return false;
    }
  }

  // method to get user by email
  async getUserByEmail(email) {
    try {
      console.log(`Getting user with email ${email} from database`);
      const user = await User.findOne({ email: email }).exec();
      return user;
    } catch (err) {
      console.log(`Unable to find user with email ${email} from database`);
      return false;
    }
  }

  // method to get all users
  async getAllUsers(filter = {}, sortOrder = { firstName: 1, lastName: 1 }) {
    try {
      const users = await User.find(filter).sort(sortOrder);
      return users;
    } catch (err) {
      console.log(`Error while fetching users from database: ${err.message}`);
      return false;
    }
  }

  // // method to get users who are clients
  // async getAllClients(
  //   sortOrder = { firstName: 1, lastName: 1, "clientDetails.company": 1 }
  // ) {
  //   try {
  //     const clients = await User.find({ "clientDetails.isClient": true }).sort(
  //       sortOrder
  //     );
  //     return clients;
  //   } catch (err) {
  //     console.log(`Error while fetching clients from database: ${err.message}`);
  //     return false;
  //   }
  // }

  // method to create a new user and if required a new client too
  async createUser(newUser, password) {
    let newClientId = "";
    // saving these variables here so that they can be used in catch block
    const clientId = newUser.clientId;
    const isClient = newUser.isClient;
    const clientCode = newUser.clientCode;
    const clientCompany = newUser.clientCompany;
    try {
      let newClient;
      // create a new client object if required
      if (isClient && clientCode && clientCompany) {
        // create a newClient object
        newClient = {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          code: clientCode,
          company: clientCompany,
          username: newUser.username,
        };
        // delete unnecessary properties from newUser
        delete newUser.clientCode;
        delete newUser.clientCompany;
        delete newUser.isClient;
        // if newClient exists add it to DB
        const newClientDoc = new Client(newClient);
        console.log(newClientDoc);
        await newClientDoc.save();
        newClientId = newClientDoc._id;
        newUser.clientId = newClientId;
      }
      // Register user
      console.log(`registering user: ${newUser}`);
      await User.register(new User(newUser), password);
      if (clientId) {
        // if user was a client already, add username to client doc
        const clientDoc = await Client.findById(clientId);
        clientDoc.username = newUser.username;
        await clientDoc.save();
      }
      return `${newUser.username} created and registered successfully!`;
    } catch (err) {
      console.log(`Error while creating user: ${err}`);
      if (newClientId) {
        try {
          await Client.findByIdAndDelete(newClientId);
          console.log("Client successfully deleted");
          // add properties back to user
          newUser.isClient = isClient;
          newUser.clientCode = clientCode;
          newUser.clientCompany = clientCompany;
        } catch (deleteErr) {
          console.log("Error deleting client:", deleteErr);
        }
      }
      return `Error while creating user ${newUser.username}`;
    }
  }
  // method to edit user
  async editUser(username, editedUser) {
    try {
      // retrive the doc
      const userDoc = await User.findOne({ username: username });
      if (!userDoc) {
        return `Error while fetching or finding ${username}`;
      }
      // save only relevant fields
      Object.assign(userDoc, editedUser);
      // saving user doc
      console.log(`saving updated doc for ${username}`);
      await userDoc.save();
      console.log(`newuser doc:${userDoc}`);
      // return success message
      console.log(`${editedUser.username}'s records updated successfully`);
      return userDoc;
    } catch (err) {
      console.log(`Error while updating: ${err.message}`);
      return false;
    }
  }

  // method to update relevant details within client records if user is a client too
  async onUpdateCascadeClient(oldUserDoc, newUserDoc) {
    const condition1 = !!newUserDoc.clientId;
    const condition2 = oldUserDoc.username === newUserDoc.username;
    const condition3 = oldUserDoc.email === newUserDoc.email;
    const condition4 = oldUserDoc.firstName === newUserDoc.firstName;
    const condition5 = oldUserDoc.lastName === newUserDoc.lastName;
    console.log(condition1, condition2, condition3, condition4, condition5);
    // if any conditions did not meet
    if (
      (!condition2 || !condition3 || !condition4 || !condition5) &&
      condition1
    ) {
      // update userDoc
      try {
        const updatedClient = await Client.findOneAndUpdate(
          // search condition
          { _id: newUserDoc.clientId },
          // new values to update
          {
            username: newUserDoc.username,
            email: newUserDoc.email,
            firstName: newUserDoc.firstName,
            lastName: newUserDoc.lastName,
          }
        );
        console.log("On update cascade successful!");
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    } else {
      console.log("On update cascade client not required");
      return true;
    }
  }

  // method to delete users
  async deleteUser(username) {
    try {
      const response = await User.findOneAndDelete({ username: username });
      return response;
    } catch (err) {
      console.log(`Error while deleting ${username}: ${err.message}`);
      return false;
    }
  }

  async onDeleteCascade(deletedUser) {
    const clientId = deletedUser.clientId;
    if (clientId) {
      // update clientDoc
      try {
        await Client.findOneAndUpdate(
          // search condition
          { _id: clientId },
          // unset the username
          { $unset: { username: "" } }
        );
        console.log("On update cascade successful!");
        return true;
      } catch (err) {
        console.log("Error during cascade update:", err);
        return false;
      }
    } else {
      console.log("Cascade not required since user is not a client");
      return true;
    }
  }
}

module.exports = UserRepo;
