const Invoice = require("../models/Invoice");

class InvoiceRepo {
  // empty constructor
  InvoiceRepo() {}

  // Method for getting all invoices
  async getAllInvoices(searchPhrase = "", username = "") {
    // initialise empty filterObj
    let filterObj = {};
    // assign value to empty filterObj
    if (searchPhrase && !username) {
      filterObj = {
        $or: [
          { "client.name": { $regex: searchPhrase, $options: "i" } },
          { "lineItems.productName": { $regex: searchPhrase, $options: "i" } },
        ],
      };
    } else if (username) {
      if (searchPhrase) {
        filterObj = {
          $and: [
            {
              "lineItems.productName": { $regex: searchPhrase, $options: "i" },
            },
            { "client.username": username },
          ],
        };
      } else {
        filterObj = { "client.username": username };
      }
    }
    // now get invoices
    try {
      const invoices = await Invoice.find(filterObj)
        .sort({ issueDate: 1 })
        .exec();
      console.log(`search successful!`);
      console.log(invoices);
      return invoices;
    } catch (error) {
      console.error("error resolving search", error.message);
      return [];
    }
  }

  // method to get one invoice by id
  async getInvoiceById(invoiceId) {
    try {
      console.log(`getting invoice ${invoiceId} from Database`);
      const invoice = await Invoice.findById(invoiceId);
      return invoice;
    } catch (error) {
      console.error(`Error while fetching invoice ${invoiceId}`, error.message);
      return false;
    }
  }

  // method to check if invoice belongs to client
  async verifyInvoice(invoiceId,username) {
    try {
      const invoice = await Invoice.findById(invoiceId);
      // check if invoice belongs to client
      return invoice.client.username===username?invoice:false;
    } catch (error) {
      console.error(`Error while fetching invoice ${invoiceId}`, error.message);
      return false;
    }
  }

  // method to create an invoice
  async createInvoice(newInvoice) {
    try {
      // create a document using newInvoice object
      const newInvoiceDoc = await Invoice.create(newInvoice);
      // check if the doc adheres to schema
      const error = await newInvoiceDoc.validate();
      // if validation fails
      if (error) {
        console.error("Error while validating");
        return "Error while validating";
      }
      // if it succeeds save new doc
      const response = await newInvoiceDoc.save();
      // return doc
      return response.id;
    } catch (error) {
      console.error("error while creating invoice", error);
      if (error.code === 11000) {
        return "Error: Invoice number must be unique";
      } else {
        return `Error ${error.message}`;
      }
    }
  }

  // method to mark an invoice paid
  async markInvoicePaid(invoiceId) {
    try {
      console.log(`marking invoice ${invoiceId} as paid`);
      const invoice = await Invoice.findById(invoiceId);
      if(!invoice || invoice.isPaid){
        console.log("Invoice not found or already paid!");
        return false;
      }
      else{
        invoice.isPaid = true;
        await invoice.save();
        return true;
      }
    } catch (error) {
      console.log("error marking invoice paid", error.message);
      return false;
    }
  }

  // method to delete an invoice
  async deleteInvoice(invoiceId) {
    try {
      console.log(`deleting invoice ${invoiceId}`);
      const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);
      console.log(`deleted invoice ${invoiceId}!`);
      return deletedInvoice;
    } catch (error) {
      console.log("error deleting invoice", error.message);
      return false;
    }
  }
}

module.exports = InvoiceRepo;
