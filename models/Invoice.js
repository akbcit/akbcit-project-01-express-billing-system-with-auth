const mongoose = require("mongoose");
// Import the Products model
const Product = require("../models/Product");

// extract schema out of the imported model
const productSchema = Product.schema;

// Create a schema for invoices
const invoiceSchema = mongoose.Schema(
  {
    invoiceNum: {
      type: Number,
      required: true,
      unique: true,
    },
    issueDate: {
      type: Date,
      required: true,
      // adding a validate property
      validate: {
        // custom validator function that ensures that the date is not in future
        validator: function (value) {
          return value <= new Date();
        },
        message: "Date cannot be in the future",
      },
    },
    dueDate: {
      type: Date,
      required: true,
      // adding a validate property
      validate: {
        // custom validator function that ensures that the date is greater than issueDate
        validator: function (value) {
          return value >= this.issueDate;
        },
        message: "Due Date cannot be earlier than issue date",
      },
    },
    // property called client to store client details
    client: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
      },
      username:{
        type: String,
      },
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      company: {
        type: String,
        required: true,
      },
      // company: String,
      email: {
        type: String,
        required: true,
      },
    },
    // add a property for lineItems array
    lineItems: {
      type: Array,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    totalDue: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
  },
  { collection: "invoices" }
);

// Create the model
const Invoice = mongoose.model("Invoice", invoiceSchema);
// export the model
module.exports = Invoice;
