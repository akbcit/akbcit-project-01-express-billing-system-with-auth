const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

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
    },
    lastName: {
      type: String,
    },
    roles: {
      type: Array,
    },
    clientDetails:{
      isClient:Boolean,
      code:String,
      company:String,
    }
  }
);

// add passportLocalMongoose plugin to schema
userSchema.plugin(passportLocalMongoose);

// create a User model using userSchema
const User = mongoose.model("User", userSchema, "users");

// export the model
module.exports = User;
