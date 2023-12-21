const Invoice = require("../models/Invoice");
const InvoiceRepo = require("../repos/invoiceRepo");
const UserRepo = require("../repos/userRepo");
const ProductRepo = require("../repos/productRepo");
const verifyAuth = require("../services/verifyAuth");
const formatClients = require("../services/formatClients");

// initialise an instance of the InvoiceRepo class
const _invoiceRepo = new InvoiceRepo();

// initialise an instance of the InvoiceRepo class
const _userRepo = new UserRepo();

// initialise an instance of the ProductRepo class
const _productRepo = new ProductRepo();

// middleware to get all invoices
exports.GetAllInvoices = async (req, res, next) => {
  const rolesPermitted = ["user", "admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // check for any searchphrase
      const searchPhrase = req.query.query;
      // initialise an empty array for invoices
      let invoices = [];
      // if not an admin or manager only get their invoices
      if (
        !authInfo.roles.includes("admin") &&
        !authInfo.roles.includes("manager")
      ) {
        const username = authInfo.username;
        invoices = await _invoiceRepo.getAllInvoices(searchPhrase, username);
      } else {
        invoices = await _invoiceRepo.getAllInvoices(searchPhrase);
      }
      return res.render("secure/users/listInvoices", {
        title: "Express Billing Project: Invoices",
        authInfo: authInfo,
        invoices: invoices,
        message: errorMessage
          ? { error: errorMessage }
          : successMessage
          ? { success: successMessage }
          : {},
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to get one invoice
exports.InvoiceDetails = async (req, res, next) => {
  const rolesPermitted = ["user", "admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // get invoiceId
      const invoiceId = req.params.invoiceId;
      let invoice = false;
      // if role does not include admin or manager verify if invoice is theirs
      if (
        !authInfo.roles.includes("manager") &&
        !authInfo.roles.includes("admin")
      ) {
        invoice = await _invoiceRepo.verifyInvoice(
          invoiceId,
          authInfo.username
        );
      } else {
        invoice = await _invoiceRepo.getInvoiceById(invoiceId);
      }
      if (invoice) {
        return res.render("secure/users/invoiceDetails",{
            title: `Express Billing Project: Invoice ${invoiceId}`,
            authInfo:authInfo,
            invoice:invoice,
        });
      } else {
        req.flash("error", "Invoice not found!");
        return res.redirect("/invoices");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to render create invoice form
exports.CreateInvoiceForm = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get products and clients
      const products = await _productRepo.getAllProducts();
      const clients = formatClients(await _userRepo.getAllClients());
      // render the form
      return res.render("secure/managers/invoiceCreate", {
        title: "",
        authInfo: authInfo,
        products: products,
        clients: clients,
        invoice: {},
        message: errorMessage
          ? { error: errorMessage }
          : successMessage
          ? { success: successMessage }
          : {},
      });
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to create invoice
exports.CreateInvoice = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // retreive message, if any from req.flash
      const errorMessage = req.flash("error")[0];
      const successMessage = req.flash("success")[0];
      // get all the data from req.body and create a new invoice object
      const clientDoc = await _userRepo.getUserById(req.body.invoiceClient);
      // create client object for invoice
      const invoiceClient = {
        id: clientDoc.id,
        username: clientDoc.username,
        name: `${clientDoc.firstName}${
          clientDoc.lastName ? ` ${clientDoc.lastName}` : ""
        }`,
        code: clientDoc.clientDetails.code,
        company: clientDoc.clientDetails.company,
        email: clientDoc.email,
      };
      // create lineitems array for invoice
      const lineItemsInput = JSON.parse(req.body.lineItems);
      let invoiceTotalDue = 0;
      // Convert the input data into an array of objects with cleaned productName
      const invoiceLineItems = lineItemsInput.map((item) => {
        // Calculate totCost for each line item
        const totCost = item.qty * item.unitCost;
        // Add totCost to the totalDue
        invoiceTotalDue += totCost;
        return {
          productId: item.productId,
          // Remove leading and trailing whitespaces
          productName: item.productName.trim(),
          qty: item.qty,
          unitCost: item.unitCost,
          totCost: totCost, // Assign the calculated totCost
        };
      });
      // create invoice object
      const newInvoice = {
        invoiceNum: req.body.invoiceNum,
        issueDate: new Date(req.body.invoiceIssueDate),
        dueDate: new Date(req.body.invoiceDueDate),
        client: invoiceClient,
        lineItems: invoiceLineItems,
        totalDue: invoiceTotalDue,
        isPaid: false,
      };
      // send to repo to create a new invoice doc
      const response = await _invoiceRepo.createInvoice(newInvoice);
      if (response.includes("Error")) {
        // get products and clients
        const products = await _productRepo.getAllProducts();
        const clients = formatClients(await _userRepo.getAllClients());
        // render the form
        return res.render("secure/managers/invoiceCreate", {
          title: "",
          authInfo: authInfo,
          products: products,
          clients: clients,
          invoice: newInvoice,
          message: { error: response },
        });
      } else {
        req.flash("success", `Invoice created successfully!`);
        return res.redirect("/invoices");
      }
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to mark invoice paid
exports.MarkInvoicePaid = async (req, res, next) => {
  const rolesPermitted = ["admin", "manager"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      // get invoiceId
      const invoiceId = req.params.invoiceId;
      const response = await _invoiceRepo.markInvoicePaid(invoiceId);
      if (response) {
        req.flash("success", "Invoice marked as paid");
      } else {
        req.flash("error", "Invoice not found or already marked paid!");
      }
      return res.redirect("/invoices");
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};

// middleware to create invoice
exports.DeleteInvoice = (req, res, next) => {
  const rolesPermitted = ["admin"];
  // check auth status
  const authInfo = verifyAuth(req, rolesPermitted);
  // check if authenticated
  if (authInfo.authenticated) {
    // check if authorised
    if (authInfo.rolePermitted) {
      const invoiceId = req.params.invoiceId;
      // send to repo for deletion
      const response = _invoiceRepo.deleteInvoice(invoiceId);
      if (response) {
        req.flash("success", "Invoice deleted successfully!");
      } else {
        req.flash("error", "Couldn't find/delete invoice!");
      }
      return res.redirect("/invoices");
    } else {
      return res.redirect("/auth/user");
    }
  } else {
    return res.redirect("/auth/login");
  }
};
