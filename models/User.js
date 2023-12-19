const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

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
