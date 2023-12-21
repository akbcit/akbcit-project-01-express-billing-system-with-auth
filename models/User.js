const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Product = require("../models/Product");

// validation and processing methods
const toSentenceCase = (str) => {
  if (!str) return str;
  return str[0].toUpperCase() + str.substring(1).toLowerCase();
}

const nameValidation = {
  validator: function(v) {
    return /^[A-Za-z]+$/.test(v);
  },
  message: props => `${props.value} is not a valid name! Only alphabets are allowed.`
};

// define user schema
const userSchema = mongoose.Schema(
  {
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
      validate: nameValidation
    },
    lastName: {
      type: String,
      set: toSentenceCase,
      validate: nameValidation
    },
    roles: {
      type: Array,
    },
    clientDetails:{
      isClient:{
        type:Boolean,
        default:false,
      },
      code:String,
      company:String,
    }
  }
);

// add passportLocalMongoose plugin to schema
userSchema.plugin(passportLocalMongoose);

// create a User model using userSchema
const User = mongoose.model("User", userSchema, "users");

// establish a change stream
const changeStream = User.watch();

changeStream.on('change', async (change) => {
  if (change.operationType === 'update' && change.updateDescription.updatedFields.username) {
    // retrieve the ID of the user whose username has been updated
    const updatedUserId = change.documentKey._id;
    // retrieve the new username
    const newUsername = change.updateDescription.updatedFields.username;
    // update the username in related invoices
    await Invoice.updateMany(
      { 'client.id': updatedUserId },
      { 'client.username': newUsername }
    );
  }
});

// export the model
module.exports = User;
