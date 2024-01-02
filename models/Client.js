const mongoose = require("mongoose");

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

// create a schema
const clientSchema = new mongoose.Schema(
  {
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
      required: true,
      set: toSentenceCase,
      validate: nameValidation,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    company: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { collection: "clients" }
);

// create a model
const Client = mongoose.model("Client", clientSchema);

// export the model
module.exports = Client;
