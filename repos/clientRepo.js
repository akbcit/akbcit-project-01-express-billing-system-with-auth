const mongoose = require("mongoose");

// import client model
const Client = require("../models/Client");
const User = require("../models/User");


class ClientRepo {
  // empty constructor
  ClientRepo() {}

  // CRUD methods for interacting with DB

  // method for getting all clients
  async getAllClients(searchPhrase = "") {
    try {
      let filterObj = {};
      if (searchPhrase) {
        filterObj = {
          name: { $regex: searchPhrase, $options: "i" },
        };
      }
      console.log("getting all clients from Database");
      const clients = await Client.find(filterObj).sort({ name: 1 }).exec();
      return clients;
    } catch (error) {
      return false;
    }
  }

  // method for getting one client by id
  async getClientById(id) {
    try {
      console.log(`getting client ${id} from Database`);
      const client = await Client.findById(id);
      return client;
    } catch (error) {
      return false;
    }
  }

  // method for getting one client by username
  async getClientByUsername(username) {
    try {
      console.log(`getting client ${username} from Database`);
      const client = await Client.findOne({ username: username });
      return client;
    } catch (error) {
      return false;
    }
  }

  // method for getting one client by email
  async getClientByEmail(email) {
    try {
      console.log(`getting client ${email} from Database`);
      const client = await Client.findOne({ email: email });
      return client;
    } catch (error) {
      return false;
    }
  }

  // method for creating a new client
  async createClient(newClient) {
    try {
      console.log(newClient);
      // create a document using newClient object
      const newClientDoc = await Client.create(newClient);
      // check if the doc adheres to schema
      const error = await newClientDoc.validate();
      // if error quit and send error as response
      if (error) {
        console.error("error while validating", error);
        return "Error, please try again!";
      }
      // else save document
      console.log("saving client record");
      await newClientDoc.save();
      // check if the client has a username attached
      if (newClient.username) {
        try {
          // get user
          const userDoc = await User.findOne({
            username: newClient.username,
          });
          if (userDoc) {
            userDoc.clientId = newClientDoc._id;
            await userDoc.save();
          }
        } catch (userUpdateErr) {
          console.log(`Error updating user: ${userUpdateErr}`);
          // delete client
          await Client.findByIdAndDelete(newClientDoc._id);
          console.log("Client deleted!");
        }
      }
      // return true
      return true;
    } catch (error) {
      // display error and return with error message
      console.error("error creating client:", error);
      return false;
    }
  }

  // method for updating a client
  async updateClient(updatedClient) {
    console.log(updatedClient);
    const clientId = updatedClient.id;
    try {
      console.log(`getting client ${clientId} from Database`);
      const clientDoc = await this.getClientById(clientId);
      console.log(clientDoc);
      if (!clientDoc) {
        // if client does not exist send back false
        console.error("error in retrieving client");
        return false;
      }
      // if client exists update the client doc and save
      console.log(`updating doc: ${clientDoc._id}`);
      // save only relevant fields
      Object.assign(clientDoc, updatedClient);
      // saving client doc
      console.log("saving clientDoc");
      await clientDoc.save();
      // return true
      return clientDoc;
    } catch (error) {
      console.error("error updating client:", error.message);
      return false;
    }
  }

  // method that updates user name, email if client details change
  async onUpdateCascadeUser(prevClientDoc, newClientDoc) {
    // check if any of username, email, name changed
    const condition1 = prevClientDoc.email === newClientDoc.email;
    const condition2 = prevClientDoc.firstName === newClientDoc.firstName;
    const condition3 = prevClientDoc.lastName === newClientDoc.lastName;
    const condition4 = !!newClientDoc.username;
    console.log(condition1,condition2,condition3,condition4);
    // if any conditions did not meet
    if ((!condition1 || !condition2 || !condition3) && condition4) {
      // update userDoc
      try {
        const updatedUser = await User.findOneAndUpdate(
          // search condition
          { username: newClientDoc.username },
          // new values to update
          {
            email: newClientDoc.email,
            firstName: newClientDoc.firstName,
            lastName: newClientDoc.lastName,
          }
        );
        console.log("On update cascade successful!");
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    } else {
      console.log("On update cascade user not required");
      return true;
    }
  }

  async deleteClient(id) {
    try {
      console.log(`Attempting to delete client ${id}`);
      // first, find the document by its ID
      const clientToDelete = await Client.findById(id);
      if (!clientToDelete) {
        console.log(`Client ${id} not found`);
        return null; // Or appropriate response indicating not found
      }
      // then, delete the document
      await Client.findByIdAndDelete(id);
      console.log(`Deleted client ${id}!`);
      // return the deleted document
      return clientToDelete;
    } catch (error) {
      console.error("Error while deleting:", error.message);
      return false;
    }
  }

  async onDeleteCascadeUser(deletedClient){
    console.log(deletedClient); 
    if(deletedClient.username){
      // update userDoc
      try {
        await User.findOneAndUpdate(
          // search condition
          { username: deletedClient.username },
          // new values to update
          { $unset: { clientId: "" } }
        );
        console.log("On update cascade successful!");
        return true;
      } catch (err) {
        console.log(err);
        return false;
      }
    }
    else{
      console.log("This client does not have a user account");
      return false;
    }
  }
}

module.exports = ClientRepo;
