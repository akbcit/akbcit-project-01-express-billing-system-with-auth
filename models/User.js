const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Invoice = require("../models/Invoice");

// validation and processing methods
const toSentenceCase = (str) => {
  if (!str) return str;
  return str[0].toUpperCase() + str.substring(1).toLowerCase();
};

const nameValidation = {
  validator: function (v) {
    return /^[A-Za-z]+$/.test(v);
  },
  message: (props) =>
    `${props.value} is not a valid name! Only alphabets are allowed.`,
};

// define user schema
const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
    set: toSentenceCase,
    validate: nameValidation,
  },
  lastName: {
    type: String,
    set: toSentenceCase,
    validate: nameValidation,
  },
  roles: {
    type: Array,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    sparse: true,
  },
});

// add passportLocalMongoose plugin to schema
userSchema.plugin(passportLocalMongoose);

// create a User model using userSchema
const User = mongoose.model("User", userSchema, "users");

// set up the change stream with the 'updateLookup' option
const userChangeStream = User.watch([], { fullDocument: 'updateLookup' });

userChangeStream.on("change", async (change) => {
  if (change.operationType === "insert" || change.operationType === "update") {
    const updatedUser = change.fullDocument;
    
    // check if the user has a clientId
    if (updatedUser && updatedUser.clientId) {
      try {
        // find and update all invoices where the client ID matches
        await Invoice.updateMany(
          { "client.id": updatedUser.clientId },
          { $set: { "client.username": updatedUser.username } }
        );
        console.log("Invoices updated with new username");
      } catch (error) {
        console.error("Error updating invoices:", error.message);
      }
    }
  }
});

// export the model
module.exports = User;
