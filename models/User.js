const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

// define user schema

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    roles: {
      type: Array,
    },
  },
  {
    collection: "users",
  }
);

// add passportLocalMongoose plugin to schema
userSchema.plugin(passportLocalMongoose);

// create a User model using userSchema
const User = mongoose.model("User",userSchema);

// export the model
module.exports = User;
