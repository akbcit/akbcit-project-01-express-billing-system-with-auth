const express = require("express");
const invoicesRouter = express.Router();

// import middlewares from controller
const {GetAllInvoices,CreateInvoiceForm,CreateInvoice,InvoiceDetails,DeleteInvoice,MarkInvoicePaid} = require("../controllers/InvoicesController");

// Define routes

// Get route for Invoices Index
invoicesRouter.get("/", GetAllInvoices);
//Get route for displaying create invoice form
invoicesRouter.get("/create", CreateInvoiceForm);
// Post route for processing create invoice form
invoicesRouter.post("/create", CreateInvoice);
// Get route for displaying invoice details
invoicesRouter.get("/:invoiceId", InvoiceDetails);
// Get route for deleting an invoice
invoicesRouter.get("/:invoiceId/delete", DeleteInvoice);
// Get route for marking an invoice paid
invoicesRouter.get("/:invoiceId/paid", MarkInvoicePaid);

module.exports = invoicesRouter;